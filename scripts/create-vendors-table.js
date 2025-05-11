import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Load SQL file
const sqlFilePath = path.join(projectRoot, 'app', 'lib', 'persistence', 'migrations', '01_create_vendors_table.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

// 创建 Supabase 客户端
const getSupabaseClient = () => {
    let supabaseUrl;
    let supabaseAnonKey;

    // 尝试从环境变量获取
    const envPath = path.join(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
        const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

        if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
        if (keyMatch && keyMatch[1]) supabaseAnonKey = keyMatch[1].trim();
    }

    // 备用的硬编码值
    if (!supabaseUrl) {
        supabaseUrl = 'https://xkcdlulngazdosqvwnsc.supabase.co';
        console.warn('未找到 SUPABASE_URL 环境变量，使用硬编码的值');
    }

    if (!supabaseAnonKey) {
        supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';
        console.warn('未找到 SUPABASE_ANON_KEY 环境变量，使用硬编码的值');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false
        }
    });
};

// 主函数
async function main() {
    console.log('正在初始化供应商表...');

    try {
        const supabase = getSupabaseClient();

        // 检查表是否已存在
        const { data, error: checkError } = await supabase
            .from('vendors')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('供应商表已存在，跳过创建');
            return;
        }

        if (checkError && checkError.code !== '42P01') {
            throw checkError;
        }

        // 表不存在，执行创建
        console.log('开始创建供应商表...');

        // 分割 SQL 语句并依次执行
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                if (error.message.includes('function "exec_sql" does not exist')) {
                    console.error('错误: Supabase 中不存在 exec_sql 函数。请通过 SQL 编辑器手动执行创建表操作。');
                    console.log('SQL 语句:', statement);
                    break;
                } else {
                    throw error;
                }
            }
        }

        console.log('供应商表创建成功！');

        // 创建测试数据
        await createTestData(supabase);

    } catch (error) {
        console.error('创建表时出错:', error);

        if (error.message && error.message.includes('42P01')) {
            console.log('\n请通过 Supabase 控制台执行以下 SQL 语句:');
            console.log(sqlContent);
        }
    }
}

// 创建测试数据
async function createTestData(supabase) {
    console.log('创建测试数据...');

    const testVendors = [
        {
            name: '供应商1',
            contact_person: '联系人',
            phone: '12345678901',
            email: '123456@126.com',
            address: '地址地址地址地址地址',
            status: '启用',
            updated_by: '张三',
            remarks: ''
        },
        {
            name: '供应商2',
            contact_person: '联系人',
            phone: '12345678901',
            email: '123456@126.com',
            address: '地址地址地址地址地址',
            status: '启用',
            updated_by: '张三',
            remarks: ''
        },
        {
            name: '供应商3',
            contact_person: '联系人',
            phone: '12345678901',
            email: '123456@126.com',
            address: '地址地址地址地址地址',
            status: '禁用',
            updated_by: '张三',
            remarks: ''
        }
    ];

    const { error } = await supabase
        .from('vendors')
        .insert(testVendors);

    if (error) {
        console.error('添加测试数据失败:', error);
    } else {
        console.log('测试数据添加成功!');
    }
}

// 执行主函数
main(); 