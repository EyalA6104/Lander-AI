"use client"; // <--- השורה הזו היא הקסם

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [serverStatus, setServerStatus] = useState("Connecting...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then((data) => {
        setServerStatus(data.message);
      })
      .catch((err) => {
        setServerStatus("Server is offline ❌");
        console.error(err);
      });
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start shadow-xl rounded-2xl">
        <Image
          className="dark:invert mb-8"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Lander-AI Dashboard
          </h1>

          {/* הסטטוס מהשרת שלך יוצג כאן */}
          <div
            className={`w-full p-6 rounded-xl border-2 ${serverStatus.includes("offline") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
          >
            <p className="text-sm uppercase tracking-wider font-semibold text-gray-500 mb-1">
              Backend Connection
            </p>
            <p className="text-lg font-medium text-gray-800">{serverStatus}</p>
          </div>

          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            השרת והלקוח מחוברים! עכשיו אפשר להתחיל לבנות את ה-AI.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white px-5 transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black md:w-[158px]"
            href="http://127.0.0.1:8000/docs"
            target="_blank"
          >
            API Docs
          </a>
        </div>
      </main>
    </div>
  );
}
