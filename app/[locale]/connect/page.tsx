"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, ArrowLeft, Copy, Check, Bot, MessageSquare, Terminal } from "lucide-react"

const MCP_URL = "https://spothinta.app/api/mcp"

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1" />
          {label}
        </>
      )}
    </Button>
  )
}

function CodeBlock({ children, copyText, copyLabel, copiedLabel }: { children: string; copyText?: string; copyLabel: string; copiedLabel: string }) {
  return (
    <div className="relative group">
      <pre className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all whitespace-pre-wrap overflow-x-auto">
        {children}
      </pre>
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={copyText || children} label={copyLabel} copiedLabel={copiedLabel} />
      </div>
    </div>
  )
}

export default function ConnectPage() {
  const t = useTranslations()

  const claudeConfig = JSON.stringify({
    mcpServers: {
      spothinta: {
        url: MCP_URL
      }
    }
  }, null, 2)

  const geminiConfig = JSON.stringify({
    mcpServers: {
      spothinta: {
        uri: MCP_URL
      }
    }
  }, null, 2)

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
              <CopyButton text={MCP_URL} label={t("connect.copyUrl")} copiedLabel={t("connect.copied")} />
            </div>
          </CardContent>
        </Card>

        {/* Instructions with tabs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("connect.instructions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="claude">
              <TabsList className="w-full">
                <TabsTrigger value="claude" className="flex-1">Claude</TabsTrigger>
                <TabsTrigger value="codex" className="flex-1">Codex</TabsTrigger>
                <TabsTrigger value="gemini" className="flex-1">Gemini</TabsTrigger>
              </TabsList>

              {/* Claude */}
              <TabsContent value="claude" className="space-y-4 pt-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>{t("connect.claude.step1")}</li>
                  <li>{t("connect.claude.step2")}</li>
                  <li>{t("connect.claude.step3")}</li>
                  <li>{t("connect.claude.step4")}</li>
                </ol>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("connect.orAddManually")} <code className="text-xs">~/.claude/settings.json</code>:
                  </p>
                  <CodeBlock copyLabel={t("connect.copyUrl")} copiedLabel={t("connect.copied")}>
                    {claudeConfig}
                  </CodeBlock>
                </div>
              </TabsContent>

              {/* Codex */}
              <TabsContent value="codex" className="space-y-4 pt-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>{t("connect.codex.step1")}</li>
                  <li>
                    {t("connect.codex.step2")}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1">
                        <CodeBlock copyLabel={t("connect.copyUrl")} copiedLabel={t("connect.copied")}>
                          {`codex --mcp-server-uri ${MCP_URL}`}
                        </CodeBlock>
                      </div>
                    </div>
                  </li>
                  <li>{t("connect.codex.step3")}</li>
                </ol>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("connect.orAddManually")} <code className="text-xs">~/.codex/config.json</code>:
                  </p>
                  <CodeBlock copyLabel={t("connect.copyUrl")} copiedLabel={t("connect.copied")}>
                    {claudeConfig}
                  </CodeBlock>
                </div>
              </TabsContent>

              {/* Gemini */}
              <TabsContent value="gemini" className="space-y-4 pt-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    {t("connect.gemini.step1")}
                    <div className="mt-2">
                      <CodeBlock copyLabel={t("connect.copyUrl")} copiedLabel={t("connect.copied")}>
                        {"~/.gemini/settings.json"}
                      </CodeBlock>
                    </div>
                  </li>
                  <li>
                    {t("connect.gemini.step2")}
                    <div className="mt-2">
                      <CodeBlock copyLabel={t("connect.copyUrl")} copiedLabel={t("connect.copied")}>
                        {geminiConfig}
                      </CodeBlock>
                    </div>
                  </li>
                  <li>{t("connect.gemini.step3")}</li>
                </ol>
              </TabsContent>
            </Tabs>
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
