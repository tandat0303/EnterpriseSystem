import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { Permission } from "@/models/Permission";
import { Department } from "@/models/Department";
import { RefreshToken } from "@/models/RefreshToken";
import { createAuditLog } from "@/lib/audit";
import { generateRefreshToken } from "@/lib/token";

export async function POST(request: Request) {
  await dbConnect();

  // Lấy refresh token từ cookie
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    await createAuditLog({
      userId: "anonymous",
      action: "refresh_token",
      resourceType: "RefreshToken",
      resourceId: "unknown",
      newData: { status: "failed_attempt" },
      description: "Làm mới token thất bại: Không tìm thấy refresh token",
      request: request as any,
    });
    return NextResponse.json({ error: "Không tìm thấy refresh token" }, { status: 401 });
  }

  try {
    // Tìm refresh token trong cơ sở dữ liệu
    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate({
      path: "userId",
      model: User,
      populate: [
        {
          path: "roleId",
          model: Role,
          populate: { path: "permissions", model: Permission },
        },
        { path: "departmentId", model: Department, select: "name" },
      ],
    });

    // Kiểm tra token có tồn tại, chưa hết hạn và chưa bị thu hồi
    if (!storedToken || storedToken.expiresAt < new Date() || storedToken.revoked) {
      if (storedToken) {
        // Nếu token tồn tại nhưng không hợp lệ, xóa nó
        await RefreshToken.deleteOne({ token: refreshToken });
      }
      await createAuditLog({
        userId: "anonymous",
        action: "refresh_token",
        resourceType: "RefreshToken",
        resourceId: refreshToken,
        newData: { status: "failed_attempt" },
        description: `Làm mới token thất bại: refresh token không hợp lệ, đã hết hạn hoặc đã bị thu hồi`,
        request: request as any,
      });
      return NextResponse.json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" }, { status: 401 });
    }

    const user = storedToken.userId;
    if (!user) {
      await createAuditLog({
        userId: "anonymous",
        action: "refresh_token",
        resourceType: "RefreshToken",
        resourceId: refreshToken,
        newData: { status: "failed_attempt" },
        description: "Làm mới token thất bại: Người dùng không tồn tại",
        request: request as any,
      });
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 401 });
    }

    // Tạo access token mới
    const userPermissions: string[] = [];
    if (user.roleId && user.roleId.permissions) {
      user.roleId.permissions.forEach((perm: any) => {
        if (perm.name) {
          userPermissions.push(perm.name);
        }
      });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      roleId: user.roleId ? user.roleId._id.toString() : null,
      roleName: user.roleId ? user.roleId.name : null,
      departmentId: user.departmentId ? user.departmentId._id.toString() : null,
      permissions: userPermissions,
    };

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables.");
      await createAuditLog({
        userId: "system",
        action: "refresh_token",
        resourceType: "System",
        resourceId: "unknown",
        newData: { error: "JWT_SECRET not defined" },
        description: "Lỗi hệ thống: JWT_SECRET không được định nghĩa",
        request: request as any,
      });
      return NextResponse.json({ error: "Lỗi cấu hình máy chủ" }, { status: 500 });
    }

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Tạo refresh token mới và xóa token cũ
    await RefreshToken.deleteOne({ token: refreshToken });
    const newRefreshToken = generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    await RefreshToken.create({
      token: newRefreshToken,
      userId: user._id,
      expiresAt: refreshTokenExpiresAt,
      revoked: false,
    });

    // Ghi log audit cho làm mới token thành công
    await createAuditLog({
      userId: user._id.toString(),
      action: "refresh_token",
      resourceType: "RefreshToken",
      resourceId: user._id.toString(),
      newData: { email: user.email, status: "success" },
      description: `Làm mới access token thành công cho người dùng: ${user.email}`,
      request: request as any,
    });

    // Trả về access token và set cookie cho refresh token mới
    const response = NextResponse.json({ accessToken }, { status: 200 });
    response.cookies.set({
      name: "refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, // Chỉ secure trong production
      sameSite: "strict",
      expires: refreshTokenExpiresAt,
      path: "/", // Đảm bảo cookie có thể truy cập trên toàn bộ ứng dụng
    });

    return response;
  } catch (error) {
    console.error("Lỗi làm mới token:", error);
    await createAuditLog({
      userId: "system",
      action: "refresh_token",
      resourceType: "System",
      resourceId: "unknown",
      newData: { error: (error as Error).message },
      description: `Lỗi hệ thống trong quá trình làm mới token. Lỗi: ${(error as Error).message}`,
      request: request as any,
    });
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}