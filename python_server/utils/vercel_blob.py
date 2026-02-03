"""
Vercel Blob Storage Utility Module

This module provides functions to upload, delete, and manage files on Vercel Blob Storage.
It uses the Vercel Blob REST API to interact with the storage service.
"""

import os
import httpx
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException


# Get the Vercel Blob token from environment variables
VERCEL_BLOB_TOKEN = "vercel_blob_rw_SY0PlCgaGN6r7NQD_9SkdFzSQd9cihJDngpXof42vuehi7Q"
if not VERCEL_BLOB_TOKEN:
    print("[WARNING] BLOB_READ_WRITE_TOKEN not found in environment variables!")


async def upload_to_vercel_blob(
    file: UploadFile,
    folder: str = "clothing_images"
) -> str:
    """
    Upload a file to Vercel Blob Storage.
    
    Args:
        file: The uploaded file from FastAPI
        folder: The folder/prefix to organize files (default: "clothing_images")
    
    Returns:
        str: The public URL of the uploaded file
    
    Raises:
        HTTPException: If upload fails or token is missing
    """
    if not VERCEL_BLOB_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Vercel Blob token not configured. Please set BLOB_READ_WRITE_TOKEN environment variable."
        )
    
    try:
        # Generate a unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        pathname = f"{folder}/{unique_filename}"
        
        # Read file content
        file_content = await file.read()
        
        # Reset file pointer for potential reuse
        await file.seek(0)
        
        # Prepare the upload request
        upload_url = f"https://blob.vercel-storage.com/{pathname}"
        
        headers = {
            "Authorization": f"Bearer {VERCEL_BLOB_TOKEN}",
            "x-content-type": file.content_type or "application/octet-stream",
        }
        
        # Upload to Vercel Blob
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                upload_url,
                content=file_content,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                print(f"[ERROR] Vercel Blob upload failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to upload to Vercel Blob: {response.text}"
                )
            
            # Parse response to get the URL
            result = response.json()
            blob_url = result.get("url")
            
            if not blob_url:
                raise HTTPException(
                    status_code=500,
                    detail="Upload succeeded but no URL returned from Vercel Blob"
                )
            
            print(f"[INFO] Successfully uploaded to Vercel Blob: {blob_url}")
            return blob_url
    
    except httpx.HTTPError as e:
        print(f"[ERROR] HTTP error during Vercel Blob upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error uploading to Vercel Blob: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error during Vercel Blob upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading to Vercel Blob: {str(e)}"
        )


async def delete_from_vercel_blob(blob_url: str) -> bool:
    """
    Delete a file from Vercel Blob Storage.
    
    Args:
        blob_url: The full URL of the blob to delete
    
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    if not VERCEL_BLOB_TOKEN:
        print("[WARNING] Cannot delete from Vercel Blob: token not configured")
        return False
    
    if not blob_url:
        return False
    
    try:
        # Vercel Blob delete endpoint
        delete_url = "https://blob.vercel-storage.com/delete"
        
        headers = {
            "Authorization": f"Bearer {VERCEL_BLOB_TOKEN}",
        }
        
        # The delete API expects the URL in the request body
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                delete_url,
                json={"urls": [blob_url]},
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"[INFO] Successfully deleted from Vercel Blob: {blob_url}")
                return True
            else:
                print(f"[WARNING] Failed to delete from Vercel Blob: {response.status_code} - {response.text}")
                return False
    
    except Exception as e:
        print(f"[ERROR] Error deleting from Vercel Blob: {e}")
        return False


async def replace_vercel_blob(
    old_url: Optional[str],
    new_file: UploadFile,
    folder: str = "clothing_images"
) -> str:
    """
    Replace an existing blob by uploading a new file and deleting the old one.
    
    Args:
        old_url: The URL of the existing blob to replace (will be deleted)
        new_file: The new file to upload
        folder: The folder/prefix for the new file
    
    Returns:
        str: The URL of the newly uploaded file
    """
    # Upload the new file first
    new_url = await upload_to_vercel_blob(new_file, folder)
    
    # Delete the old file (if it exists)
    if old_url:
        await delete_from_vercel_blob(old_url)
    
    return new_url
