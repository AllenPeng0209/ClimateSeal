import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 获取用户列表
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.name,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createTime: user.createTime.toISOString(),
      updateTime: user.updateTime.toISOString(),
      updatedBy: user.updatedBy || '-',
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 创建用户
const createUserSchema = z.object({
  username: z.string()
    .min(1, '用户名不能为空')
    .max(32, '用户名长度不能超过32个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, '用户名只能包含中英文、数字、下划线、中划线'),
  email: z.string()
    .email('邮箱格式不正确')
    .max(64, '邮箱长度不能超过64个字符'),
  roleId: z.string().uuid('角色ID格式不正确'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        ...validatedData,
        status: true,
        isEmailVerified: false,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.name,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createTime: user.createTime.toISOString(),
      updateTime: user.updateTime.toISOString(),
      updatedBy: user.updatedBy || '-',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
} 