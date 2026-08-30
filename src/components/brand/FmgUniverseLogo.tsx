import Image, { type ImageProps } from "next/image";

export const FMG_UNIVERSE_LIGHT_LOGO = "/logo/FMG-Universe-light.svg";
export const FMG_UNIVERSE_DARK_LOGO = "/logo/FMG-Universe-dark.svg";

type FmgUniverseLogoProps = Omit<
  ImageProps,
  "src" | "alt" | "priority" | "preload" | "loading"
> & {
  alt?: string;
};

export default function FmgUniverseLogo({
  alt = "FMG Universe logo",
  className = "",
  ...props
}: FmgUniverseLogoProps): React.JSX.Element {
  return (
    <>
      <Image
        {...props}
        src={FMG_UNIVERSE_LIGHT_LOGO}
        alt={alt}
        className={`${className} dark:hidden`}
        data-no-translate
      />
      <Image
        {...props}
        src={FMG_UNIVERSE_DARK_LOGO}
        alt={alt}
        className={`${className} hidden dark:block`}
        data-no-translate
      />
    </>
  );
}
