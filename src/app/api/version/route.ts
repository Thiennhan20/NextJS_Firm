import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching so we always get the latest Vercel env vars

const VERSION_UPDATED_AT =
  process.env.VERCEL_DEPLOYMENT_CREATED_AT ||
  process.env.VERCEL_GIT_COMMIT_DATE ||
  process.env.BUILD_TIME ||
  new Date().toISOString();

export async function GET() {
  // Lấy Git Hash tự động do Vercel cấp lúc nạp code
  // VERCEL_GIT_COMMIT_SHA sẽ tự thay đổi thành mã hash mới nhất sau mỗi lần Vercel deploy xong.
  const hash = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Hệ thống có bản cập nhật cốt lõi (Giao diện / Tính năng) mới.';

  return NextResponse.json({
    hash: hash,
    changelog: [message],
    description: 'Bản cập nhật bắt buộc tải lại để tránh lỗi gián đoạn do chênh lệch phiên bản code.',
    updatedAt: VERSION_UPDATED_AT
  });
}
