'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Suspense } from "react";

export default function VerifyEmailInfoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailInfoPageInner />
    </Suspense>
  );
}

function VerifyEmailInfoPageInner() {
  const searchParams = useSearchParams();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Lấy email từ query string
  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) setEmail(emailFromQuery);
    else setError("Không tìm thấy email. Vui lòng đăng ký lại hoặc kiểm tra link xác thực.");
  }, [searchParams]);

  useEffect(() => {
    if (!email || shouldRedirect) return;
    setError("");
    setChecking(true);
    const interval = setInterval(async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/check-email-verified`;
        const res = await axios.get(apiUrl, { params: { email } });
        if (res.data?.isEmailVerified) {
          setShouldRedirect(true);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } }).response?.status === 404) {
          setError("Không tìm thấy email này. Vui lòng kiểm tra lại.");
        } else {
          setError("Có lỗi xảy ra khi kiểm tra trạng thái xác thực.");
        }
      } finally {
        setChecking(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [email, shouldRedirect, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto p-4 sm:p-8 mt-10 sm:mt-20 bg-gradient-to-br from-yellow-900/95 to-black/95 backdrop-blur-lg rounded-2xl shadow-2xl border-4 border-yellow-500 text-center relative overflow-hidden"
    >
      <div className="flex justify-center mb-4 sm:mb-6">
        <ClockIcon className="h-10 w-10 sm:h-14 sm:w-14 text-yellow-400 animate-pulse" />
      </div>
      <h2 className="text-xl sm:text-3xl font-extrabold mb-3 sm:mb-4 text-yellow-400 drop-shadow-lg tracking-wide">
        Kiểm tra email để xác thực tài khoản
      </h2>
      <p className="text-yellow-200 mb-4 sm:mb-6 text-sm sm:text-base">
        Chúng tôi đã gửi một email xác thực tới địa chỉ bạn vừa đăng ký.<br />
        <span className="text-yellow-300 font-semibold">Vui lòng kiểm tra hộp thư (bao gồm cả mục Spam/Junk) và làm theo hướng dẫn để kích hoạt tài khoản.</span>
      </p>
      {checking && email && (
        <div className="flex items-center justify-center gap-2 text-yellow-300 mb-3 sm:mb-4 animate-pulse">
          <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-sm sm:text-base">Đang kiểm tra trạng thái xác thực...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center gap-2 text-red-400 mb-3 sm:mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}
      <p className="text-yellow-300 text-sm sm:text-base mb-2">
        Sau khi xác thực, bạn có thể đăng nhập vào hệ thống.<br/>
        {shouldRedirect ? (
          <span className="flex items-center justify-center gap-2 text-green-400 font-bold animate-bounce mt-2"><CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />Xác thực thành công! Đang chuyển về trang đăng nhập...</span>
        ) : (
          <span className="text-yellow-400">Bạn sẽ được chuyển về trang đăng nhập sau khi xác thực thành công.</span>
        )}
      </p>
      <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 opacity-30 pointer-events-none select-none">
        <svg width="80" height="80" className="sm:w-[120px] sm:h-[120px]" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="60" fill="#FFD600" /></svg>
      </div>
    </motion.div>
  );
} 