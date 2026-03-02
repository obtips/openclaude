import type { APIRoute } from 'astro'

// GET: 获取 settings.json
export const GET: APIRoute = async (context) => {
    const { request, locals } = context
    const env = (locals as any).runtime?.env || import.meta.env

    const token = env.GITHUB_TOKEN
    const owner = env.GITHUB_REPO_OWNER
    const repo = env.GITHUB_REPO_NAME

    // Debug: 返回环境变量信息（隐藏 token）
    if (!token || !owner || !repo) {
        return new Response(JSON.stringify({
            enableEnglish: false,
            _debug: 'Missing env vars',
            _hasToken: !!token,
            _hasOwner: !!owner,
            _hasRepo: !!repo,
            _tokenPrefix: token?.substring(0, 10) || 'empty'
        }), {
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/src/content/pages/settings.json`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'OpenClaude-Bot'
                },
                // GitHub API 默认有 ETag 缓存，利用它
            }
        )

        if (!response.ok) {
            const errText = await response.text()
            return new Response(JSON.stringify({
                enableEnglish: false,
                _debug: errText,
                _status: response.status,
                _debugInfo: {
                    owner,
                    repo,
                    tokenPrefix: token?.substring(0, 7) + '...',
                    tokenType: typeof token
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const data = await response.json()
        const content = atob(data.content)
        const settings = JSON.parse(content)

        return new Response(JSON.stringify({ ...settings, sha: data.sha }), {
            headers: {
                'Content-Type': 'application/json',
                // 缓存 60 秒，让前端可以短暂缓存
                'Cache-Control': 'public, max-age=60, s-maxage=60'
            }
        })
    } catch {
        return new Response(JSON.stringify({ enableEnglish: false }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=60'
            }
        })
    }
}

// PUT: 更新 settings.json
export const PUT: APIRoute = async (context) => {
    const { request, locals } = context
    const env = (locals as any).runtime?.env || import.meta.env

    // (省略验证机制，为了加快验证错误抛出，先关注 request 阶段)
    const token = env.GITHUB_TOKEN
    const owner = env.GITHUB_REPO_OWNER
    const repo = env.GITHUB_REPO_NAME

    if (!token || !owner || !repo) {
        return new Response(JSON.stringify({ error: 'Missing env vars' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    let step = 'init'
    let rawBody = ''
    try {
        step = 'request.text()'
        rawBody = await request.text()

        step = 'JSON.parse(request.text)'
        const body = JSON.parse(rawBody || '{}')
        const { content, sha, enableEnglish } = body

        step = 'github-put'
        const fileContent = content || JSON.stringify({ enableEnglish }, null, 2) + '\n'

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/src/content/pages/settings.json`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Cloudflare-Pages'
                },
                body: JSON.stringify({
                    message: `chore: update site settings (enableEnglish: ${enableEnglish})`,
                    content: btoa(fileContent),
                    sha: sha || undefined,
                }),
            }
        )

        step = 'response-check'
        if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = errorText
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.message || errorText
            } catch (e) { }
            return new Response(JSON.stringify({ error: errorMessage }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        step = 'response.json()'
        const data = await response.json()
        return new Response(JSON.stringify({ success: true, sha: data.content.sha }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (e: any) {
        return new Response(JSON.stringify({
            error: `[${step}] ${e.message}`,
            rawBodyExtract: rawBody.slice(0, 100)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
