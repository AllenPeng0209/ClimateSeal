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

// supabase.ts 中的硬编码值
const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';

// 创建 Supabase 客户端
const getSupabaseClient = () => {
    let supabaseUrl = process.env.VITE_SUPABASE_URL;
    let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    // 如果环境变量中没有找到，使用硬编码的备用值
    if (!supabaseUrl) {
        console.warn('Supabase URL not found in environment variables, using hardcoded fallback.');
        supabaseUrl = HARDCODED_SUPABASE_URL;
    }

    if (!supabaseAnonKey) {
        console.warn('Supabase Anon Key not found in environment variables, using hardcoded fallback.');
        supabaseAnonKey = HARDCODED_SUPABASE_ANON_KEY;
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
            await createTestData(supabase);
            return;
        }
        
        if (checkError && checkError.code !== '42P01') {
            throw checkError;
        }
        
        // 表不存在，提示手动创建
        console.log('\n由于 Supabase API 限制，无法通过脚本自动创建表结构。');
        console.log('请登录 Supabase 控制台 (https://app.supabase.com)');
        console.log('打开项目 -> SQL 编辑器，运行以下 SQL 脚本:');
        console.log('----------------------------------------');
        console.log(sqlContent);
        console.log('----------------------------------------');
        console.log('\n创建表后，再次运行此脚本以添加测试数据。');
        
    } catch (error) {
        console.error('操作出错:', error);
        
        if (error.message && error.message.includes('42P01')) {
            console.log('\n请登录 Supabase 控制台 (https://app.supabase.com)');
            console.log('打开 SQL 编辑器，运行以下 SQL 脚本:');
            console.log('----------------------------------------');
            console.log(sqlContent);
            console.log('----------------------------------------');
        }
    }
}

// 创建测试数据
async function createTestData(supabase) {
    console.log('创建测试数据...');
    
    // 首先检查是否已有测试数据
    const { data: existingData, error: checkError } = await supabase
        .from('vendors')
        .select('count')
        .limit(1);
        
    if (!checkError && existingData && existingData.length > 0) {
        console.log('已存在供应商数据，跳过添加测试数据');
        return;
    }
    
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