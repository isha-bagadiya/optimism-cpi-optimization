import React from "react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <nav className="relative min-h-[100px] md:min-h-[150px] bg-dark-gray">
      <div className="px-4">
        <div className="flex justify-between items-center h-30 overflow-visible">
          <div className="flex-shrink-0 flex items-center">
            <Link href="https://www.daocpi.com/">
              <Image
                src="/assets/images/CPI.svg"
                alt="Logo"
                width={300}
                height={50}
                quality={75}
                priority={true}
                placeholder="blur"
                blurDataURL="data:image/webp;base64,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"
                // loader={imageLoader}
                // preload="true"
                className="cursor-pointer w-[200px] md:w-[300px] "
              />
            </Link>
          </div>
        </div>
      </div>
      {/* <div className="absolute z-20 top-0 right-0">
                <Image
                    src={hero1}
                    alt="Hero background"
                    className=''
                    priority
                />
            </div> */}
    </nav>
  );
};

export default Header;
