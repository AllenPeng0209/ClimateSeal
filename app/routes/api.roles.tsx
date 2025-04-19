import { json } from "@remix-run/node";
import { z } from "zod";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { prisma } from "~/lib/db.server";
import { formatDate } from "~/utils/date";

// 角色数据验证schema
const roleSchema = z.object({
  name: z.string().min(2, "角色名称至少2个字符").max(50, "角色名称最多50个字符"),
  code: z.string().min(2, "角色代码至少2个字符").max(50, "角色代码最多50个字符"),
  description: z.string().max(200, "角色描述最多200个字符").optional(),
});

// GET: 获取角色列表
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "desc" },
    });

    return json({
      success: true,
      data: roles.map(role => ({
        ...role,
        createdAt: formatDate(role.createdAt),
        updatedAt: formatDate(role.updatedAt),
      })),
    });
  } catch (error) {
    console.error("获取角色列表失败:", error);
    return json({ success: false, message: "获取角色列表失败" }, { status: 500 });
  }
};

// POST: 创建新角色
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ success: false, message: "不支持的请求方法" }, { status: 405 });
  }

  try {
    const data = await request.json();
    const validatedData = roleSchema.parse(data);

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { code: validatedData.code },
    });

    if (existingRole) {
      return json(
        { success: false, message: "角色代码已存在" },
        { status: 400 }
      );
    }

    const newRole = await prisma.role.create({
      data: validatedData,
    });

    return json({
      success: true,
      data: {
        ...newRole,
        createdAt: formatDate(newRole.createdAt),
        updatedAt: formatDate(newRole.updatedAt),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("创建角色失败:", error);
    return json({ success: false, message: "创建角色失败" }, { status: 500 });
  }
}; 