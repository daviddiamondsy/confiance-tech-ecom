import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

export default function ApiDocsPage() {
  const filePath = path.join(process.cwd(), 'API-PUBLIC.md');
  
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    notFound();
  }

  // Convert markdown to HTML with proper anchors
  const htmlContent = content
    // Add IDs to headers for anchor links
    .replace(/^## (.+)$/gm, '<h2 id="$1" class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 id="$1" class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 id="$1" class="text-lg font-medium mt-4 mb-2">$1</h4>')
    // Convert code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 py-0.5 rounded text-sm">$1</code>')
    // Convert bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert italic text
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Convert blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 my-4 text-gray-600">$1</blockquote>')
    // Convert horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-gray-300">')
    // Convert line breaks to paragraphs (simple approach)
    .split('\n\n')
    .map(para => {
      if (para.startsWith('<')) return para;
      return `<p class="my-4 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Developer Documentation</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-slate max-w-none">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  );
}
