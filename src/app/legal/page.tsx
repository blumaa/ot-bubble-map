import type { Metadata } from "next";
import { CONTACT_EMAIL, EDUCATIONAL_NOTICE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Legal" };

export default function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-4 font-display text-2xl font-semibold">Legal</h1>
      <p className="mb-6">{EDUCATIONAL_NOTICE}</p>

      <h2 className="mb-2 font-display text-xl font-semibold">Copyright claims</h2>
      <p className="mb-3">
        We endeavor to ensure that all the tunes on the {SITE_NAME} web site are in the public domain or that the
        owners have granted permission to include them here.
      </p>
      <p className="mb-6">
        If you are a copyright owner or agent thereof and believe that any of our content infringes upon your
        copyright, please submit notice, pursuant to the Digital Millennium Copyright Act (17 U.S.C. § 512) to our
        Copyright Agent with the following information: (i) an electronic or physical signature of the person
        authorized to act on behalf of the owner of the copyright; (ii) a description of the copyrighted work that you
        claim has been infringed; (iii) the URL of the location containing the material that you claim is infringing;
        (iv) your address, telephone number, and email address; (v) a statement by you that you have a good faith
        belief that the disputed use is not authorized by the copyright owner, its agent, or the law; and (vi) a
        statement by you, made under penalty of perjury, that the above information in your Notice is accurate and
        that you are the copyright owner or authorized to act on the copyright owner’s behalf.
      </p>

      <h2 className="mb-2 font-display text-xl font-semibold">Contact</h2>
      <p>
        Please contact the site maintainer with any issues by email:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="link">
          {CONTACT_EMAIL}
        </a>
      </p>
    </main>
  );
}
