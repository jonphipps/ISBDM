// scripts/relationshipsSidebarLeaves.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const relationshipsDir = path.join(__dirname, '..', 'docs', 'relationships');

function getFilesByCategory(category: string): string[] {
    return fs
        .readdirSync(relationshipsDir)
        .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
        .filter((file) => {
            const filePath = path.join(relationshipsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(content);
            return data.sidebar_category === category;
        })
        .map((file) => `relationships/${file.replace(/\.mdx?$/, '')}`);
}

export const agents = getFilesByCategory('agents');
export const resources = getFilesByCategory('resources');
export const placetimes = getFilesByCategory('placetimes');
export const nomens = getFilesByCategory('nomens');
