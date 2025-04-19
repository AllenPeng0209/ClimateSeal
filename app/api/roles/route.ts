import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 获取角色列表
export async function GET() {
  try {
    const roles = await prisma.role.findMany();

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description || '-',
      status: role.status,
      createTime: role.createTime.toISOString(),
      updateTime: role.updateTime.toISOString(),
      updatedBy: role.updatedBy || '-',
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// 创建角色
const createRoleSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(32, '角色名称长度不能超过32个字符'),
  code: z.string()
    .min(1, '角色代码不能为空')
    .max(32, '角色代码长度不能超过32个字符')
    .regex(/^[A-Z_]+$/, '角色代码只能包含大写字母和下划线'),
  description: z.string()
    .max(200, '角色描述长度不能超过200个字符')
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { code: validatedData.code },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: '该角色代码已存在' },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        ...validatedData,
        status: true,
      },
    });

    return NextResponse.json({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description || '-',
      status: role.status,
      createTime: role.createTime.toISOString(),
      updateTime: role.updateTime.toISOString(),
      updatedBy: role.updatedBy || '-',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('创建角色失败:', error);
    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    );
  }
} 