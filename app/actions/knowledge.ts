'use server';

import { uploadKnowledge, listKnowledgeBase, deleteKnowledge, getKnowledgeBaseDocument, getKnowledgeBaseContent } from '@/lib/elevenlabs';

export async function getKnowledge(documentId: string) {
    try {
        const data = await getKnowledgeBaseDocument(documentId);

        // Check for truncated content message
        if (data.extracted_inner_html === "Document is too large to show the content.") {
            console.log(`Document ${documentId} is too large, fetching full content...`);
            try {
                const fullContent = await getKnowledgeBaseContent(documentId);

                if (typeof fullContent === 'string') {
                    data.extracted_inner_html = fullContent;
                } else if (fullContent.extracted_inner_html) {
                    data.extracted_inner_html = fullContent.extracted_inner_html;
                }
            } catch (contentError) {
                console.error('Error fetching full content:', contentError);
                // Fallback: keep the original message or set error
            }
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Error getting knowledge document:', error);
        return { success: false, error: error.message };
    }
}

export async function getKnowledgeBase() {
    try {
        const data = await listKnowledgeBase();
        return { success: true, data };
    } catch (error: any) {
        console.error('Error listing knowledge base:', error);
        return { success: false, error: error.message };
    }
}

export async function removeKnowledge(documentId: string) {
    try {
        const success = await deleteKnowledge(documentId);
        return { success, error: success ? undefined : 'Failed to delete document' };
    } catch (error: any) {
        console.error('Error deleting knowledge:', error);
        return { success: false, error: error.message };
    }
}

export async function addUrlKnowledge(url: string) {
    try {
        // 1. Fetch the content from the URL
        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText} (${response.status})`);
        }
        const html = await response.text();

        // 2. Strip HTML tags to get plain text (Basic implementation)
        const text = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

        if (!text) {
            throw new Error('No text content found at the URL');
        }

        // 3. Create a File-like object (Blob) for the text
        const blob = new Blob([text], { type: 'text/plain' });

        // 4. Create FormData
        const formData = new FormData();
        const filename = new URL(url).hostname + '.txt';
        formData.append('file', blob, filename);
        formData.append('name', filename);

        // 5. Upload to ElevenLabs
        console.log('Uploading URL content to ElevenLabs...');
        const result = await uploadKnowledge(formData);
        console.log('Upload result:', result);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error adding URL knowledge:', error);
        return { success: false, error: error.message };
    }
}

export async function addTextKnowledge(title: string, content: string) {
    try {
        // 1. Create a File-like object (Blob) for the text
        const blob = new Blob([content], { type: 'text/plain' });

        // 2. Create FormData
        const formData = new FormData();
        const filename = (title || 'Untitled') + '.txt';
        formData.append('file', blob, filename);
        formData.append('name', title);

        // 3. Upload to ElevenLabs
        console.log('Uploading text content to ElevenLabs...');
        const result = await uploadKnowledge(formData);
        console.log('Upload result:', result);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error adding text knowledge:', error);
        return { success: false, error: error.message };
    }
}

export async function addFileKnowledge(formData: FormData) {
    try {
        console.log('Uploading file content to ElevenLabs...');
        const result = await uploadKnowledge(formData);
        console.log('Upload result:', result);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error adding file knowledge:', error);
        return { success: false, error: error.message };
    }
}
