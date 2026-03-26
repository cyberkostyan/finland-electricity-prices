"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ArrowLeft, Copy, Check, Bot, MessageSquare } from "lucide-react"

const MCP_URL = "https://spothinta.app/api/mcp"

export default function ConnectPage() {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  const copyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="p-2 bg-primary rounded-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("connect.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("connect.description")}</p>
          </div>
        </div>

        {/* MCP URL */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              {t("connect.mcpUrl")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                {MCP_URL}
              </code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("connect.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {t("connect.copyUrl")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("connect.instructions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>{t("connect.instructions.step1")}</li>
              <li>{t("connect.instructions.step2")}</li>
              <li>{t("connect.instructions.step3")}</li>
              <li>{t("connect.instructions.step4")}</li>
            </ol>
          </CardContent>
        </Card>

        {/* Example queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              {t("connect.examples.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example1")}&rdquo;
              </li>
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example2")}&rdquo;
              </li>
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example3")}&rdquo;
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
