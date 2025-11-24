#!/bin/bash
# Upload book data to Cloudflare R2
# Usage: ./scripts/upload-to-r2.sh <book_folder>

BOOK_FOLDER=$1
BUCKET_NAME="reader3-books"

if [ -z "$BOOK_FOLDER" ]; then
  echo "❌ Error: Please specify a book folder"
  echo ""
  echo "Usage: ./scripts/upload-to-r2.sh <book_folder>"
  echo "Example: ./scripts/upload-to-r2.sh dracula_data"
  exit 1
fi

if [ ! -d "$BOOK_FOLDER" ]; then
  echo "❌ Error: Folder '$BOOK_FOLDER' not found"
  exit 1
fi

if [ ! -f "$BOOK_FOLDER/book.json" ]; then
  echo "❌ Error: book.json not found in '$BOOK_FOLDER'"
  echo "💡 Tip: Run 'python3 scripts/convert-to-json.py $BOOK_FOLDER' first"
  exit 1
fi

echo "📤 Uploading $BOOK_FOLDER to R2..."
echo ""

# Upload book.json
echo "📄 Uploading book.json..."
wrangler r2 object put $BUCKET_NAME/$BOOK_FOLDER/book.json --file=$BOOK_FOLDER/book.json

if [ $? -ne 0 ]; then
  echo "❌ Failed to upload book.json"
  exit 1
fi

# Upload images if they exist
if [ -d "$BOOK_FOLDER/images" ]; then
  IMAGE_COUNT=$(ls -1 $BOOK_FOLDER/images | wc -l)

  if [ $IMAGE_COUNT -gt 0 ]; then
    echo ""
    echo "🖼️  Uploading $IMAGE_COUNT images..."

    for img in $BOOK_FOLDER/images/*; do
      if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  📤 $filename"
        wrangler r2 object put $BUCKET_NAME/$BOOK_FOLDER/images/$filename --file=$img --content-type=image/$(echo "$filename" | rev | cut -d. -f1 | rev)

        if [ $? -ne 0 ]; then
          echo "  ⚠️  Warning: Failed to upload $filename"
        fi
      fi
    done
  else
    echo "ℹ️  No images to upload"
  fi
else
  echo "ℹ️  No images folder found"
fi

echo ""
echo "✅ Upload complete!"
echo ""
echo "🌐 Your book is now available at:"
echo "   https://reader3.<your-subdomain>.workers.dev"
echo ""
echo "💡 Next steps:"
echo "   1. Run 'wrangler deploy' if you haven't already"
echo "   2. Visit your site to see the new book"
