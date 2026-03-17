import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Check Email - Recipe Catalogue" };

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            A sign-in link has been sent to your email address. Click the link
            to continue.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
