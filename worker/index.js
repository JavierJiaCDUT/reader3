/**
 * Cloudflare Worker for reader3 EPUB Reader
 *
 * This worker serves the EPUB reader application using:
 * - Hono framework for routing
 * - R2 for book storage
 * - Template strings for HTML rendering
 */

import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { libraryTemplate } from './templates/library.js';
import { readerTemplate } from './templates/reader.js';
import { adminTemplate } from './templates/admin.js';

const app = new Hono();

// Cache static responses for 1 hour
app.use('*', cache({
  cacheName: 'reader3',
  cacheControl: 'max-age=3600',
}));

/**
 * Home page - Library view
 * Lists all available books
 */
app.get('/', async (c) => {
  try {
    const env = c.env;

    // List all books from R2
    const books = await listBooks(env.R2_BUCKET);

    // Render library template
    const html = libraryTemplate({ books });

    return c.html(html);
  } catch (error) {
    console.error('Error loading library:', error);
    return c.text('Error loading library', 500);
  }
});

/**
 * Redirect /read/:book to /read/:book/0
 */
app.get('/read/:bookId', async (c) => {
  const bookId = c.req.param('bookId');
  return c.redirect(`/read/${bookId}/0`);
});

/**
 * Reader page - Display specific chapter
 */
app.get('/read/:bookId/:chapterIndex', async (c) => {
  try {
    const bookId = c.req.param('bookId');
    const chapterIndex = parseInt(c.req.param('chapterIndex'));
    const env = c.env;

    // Load book data from R2
    const book = await loadBook(env.R2_BUCKET, bookId);

    if (!book) {
      return c.text('Book not found', 404);
    }

    if (chapterIndex < 0 || chapterIndex >= book.spine.length) {
      return c.text('Chapter not found', 404);
    }

    const currentChapter = book.spine[chapterIndex];
    const prevIdx = chapterIndex > 0 ? chapterIndex - 1 : null;
    const nextIdx = chapterIndex < book.spine.length - 1 ? chapterIndex + 1 : null;

    // Render reader template
    const html = readerTemplate({
      book,
      bookId,
      currentChapter,
      chapterIndex,
      prevIdx,
      nextIdx
    });

    return c.html(html);
  } catch (error) {
    console.error('Error loading chapter:', error);
    return c.text('Error loading chapter', 500);
  }
});

/**
 * Serve book images
 */
app.get('/read/:bookId/images/:imageName', async (c) => {
  try {
    const bookId = c.req.param('bookId');
    const imageName = c.req.param('imageName');
    const env = c.env;

    // Get image from R2
    const imageKey = `${bookId}/images/${imageName}`;
    const object = await env.R2_BUCKET.get(imageKey);

    if (!object) {
      return c.text('Image not found', 404);
    }

    // Determine content type
    const contentType = getContentType(imageName);

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return c.text('Error loading image', 500);
  }
});

/**
 * Admin page - Book management
 */
app.get('/admin', async (c) => {
  try {
    const env = c.env;

    // Load full book data for admin view
    const books = await listBooksDetailed(env.R2_BUCKET);

    const html = adminTemplate({ books, uploadEnabled: true });

    return c.html(html);
  } catch (error) {
    console.error('Error loading admin:', error);
    return c.text('Error loading admin page', 500);
  }
});

/**
 * Upload book (ZIP file containing book.json and images/)
 * Since Cloudflare Workers can't run Python EPUB processing,
 * we accept pre-processed ZIP files created by convert-to-json.py
 */
app.post('/admin/upload', async (c) => {
  try {
    const env = c.env;
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file) {
      return c.text('No file uploaded', 400);
    }

    // For now, we'll accept EPUB files but explain they need pre-processing
    // In a production setup, you'd either:
    // 1. Pre-process EPUBs locally and upload the resulting JSON
    // 2. Use a separate processing service
    // 3. Integrate a JavaScript EPUB parser (like epub.js)

    if (file.name.endsWith('.epub')) {
      return c.text('EPUB files need to be pre-processed. Please use: python3 reader3.py <file.epub> && python3 scripts/convert-to-json.py <book_data> && ./scripts/upload-to-r2.sh <book_data>', 400);
    }

    return c.text('Upload functionality requires pre-processed book data. See documentation for details.', 400);
  } catch (error) {
    console.error('Error uploading book:', error);
    return c.text('Error uploading book: ' + error.message, 500);
  }
});

/**
 * Delete a book from R2
 */
app.delete('/admin/delete/:bookId', async (c) => {
  try {
    const bookId = c.req.param('bookId');
    const env = c.env;

    // List all objects for this book
    const list = await env.R2_BUCKET.list({ prefix: bookId + '/' });

    if (list.objects.length === 0) {
      return c.text('Book not found', 404);
    }

    // Delete all objects
    const deletePromises = list.objects.map(obj =>
      env.R2_BUCKET.delete(obj.key)
    );

    await Promise.all(deletePromises);

    return c.json({ success: true, deleted: list.objects.length });
  } catch (error) {
    console.error('Error deleting book:', error);
    return c.text('Error deleting book: ' + error.message, 500);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ status: 'ok', version: '3.0' });
});

/**
 * List all available books from R2 (simplified view)
 */
async function listBooks(bucket) {
  const books = [];

  // List all book.json files in R2
  const list = await bucket.list();

  for (const object of list.objects) {
    // Look for book.json files
    if (object.key.endsWith('/book.json')) {
      const bookId = object.key.replace('/book.json', '');

      try {
        const bookData = await bucket.get(object.key);
        const book = await bookData.json();

        books.push({
          id: bookId,
          title: book.metadata.title,
          author: book.metadata.authors.join(', '),
          chapters: book.spine.length
        });
      } catch (error) {
        console.error(`Error loading book ${bookId}:`, error);
      }
    }
  }

  return books;
}

/**
 * List all available books from R2 (detailed view for admin)
 */
async function listBooksDetailed(bucket) {
  const books = [];

  // List all book.json files in R2
  const list = await bucket.list();

  for (const object of list.objects) {
    // Look for book.json files
    if (object.key.endsWith('/book.json')) {
      const bookId = object.key.replace('/book.json', '');

      try {
        const bookData = await bucket.get(object.key);
        const book = await bookData.json();

        books.push({
          id: bookId,
          metadata: book.metadata,
          spine: book.spine
        });
      } catch (error) {
        console.error(`Error loading book ${bookId}:`, error);
      }
    }
  }

  return books;
}

/**
 * Load a specific book from R2
 */
async function loadBook(bucket, bookId) {
  const bookKey = `${bookId}/book.json`;

  try {
    const object = await bucket.get(bookKey);

    if (!object) {
      return null;
    }

    const book = await object.json();
    return book;
  } catch (error) {
    console.error(`Error loading book ${bookId}:`, error);
    return null;
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();

  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp'
  };

  return types[ext] || 'application/octet-stream';
}

export default app;
