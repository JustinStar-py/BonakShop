import Image from "next/image";
import Link from "next/link";

const apkDownloadUrl = "/baharnaron.apk";

const appFeatures = [
  "سفارش سریع و ساده",
  "پیگیری وضعیت سفارش",
  "مدیریت حرفه ای سبد خرید",
  "پیشنهادهای ویژه روزانه",
];

const installSteps = [
  "فایل APK را دانلود کنید.",
  "روی فایل دانلود شده بزنید و نصب را شروع کنید.",
  "در صورت نیاز، اجازه نصب از منابع دیگر را فعال کنید.",
  "اپ را باز کنید و با شماره موبایل وارد شوید.",
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-white px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-3xl border border-green-100 bg-white/90 p-6 shadow-xl shadow-green-100/70 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-green-100 bg-white">
              <Image
                src="/logo.png"
                alt="Bonak Shop"
                width={56}
                height={56}
                sizes="56px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-xs text-gray-900">اپلیکیشن فروشگاهی</p>
              <h1 className="text-xl font-black text-green-700">بهــــــــارنارون</h1>
            </div>
          </div>

          <p className="mb-5 text-sm leading-7 text-gray-600">
            نسخه اندروید فروشگاه را با طراحی اصلی خود اپ نصب کنید و خرید عمده را سریع تر انجام دهید.
          </p>

          <div className="mb-6 grid grid-cols-2 gap-2">
            {appFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-center text-xs font-semibold text-green-800"
              >
                {feature}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <a
              href={apkDownloadUrl}
              download
              className="block w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:from-green-700 hover:to-emerald-600"
            >
              دانلود مستقیم APK
            </a>

            <Link
              href="/"
              className="block w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-center text-sm font-bold text-green-700 transition hover:bg-green-50"
            >
              ورود به فروشگاه
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-md shadow-gray-100">
          <h2 className="mb-3 text-sm font-extrabold text-gray-900">راهنمای نصب</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            {installSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-2 leading-7">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
