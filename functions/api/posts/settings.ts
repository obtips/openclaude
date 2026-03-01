// GET: 获取 settings.json
export const onRequestGet = async (context: any) => {
    const { request, env } = context

    const token = env.GITHUB_TOKEN
    const owner = env.GITHUB_REPO_OWNER
    const repo = env.GITHUB_REPO_NAME

    if (!token || !owner || !repo) {
        return new Response(JSON.stringify({ enableEnglish: false }), {
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/src/content/pages/settings.json?t=${Date.now()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Cloudflare-Pages'
                },
            }
        )

        if (!response.ok) {
            return new Response(JSON.stringify({ enableEnglish: false }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const data = await response.json()
        const content = atob(data.content)
        const settings = JSON.parse(content)

        return new Response(JSON.stringify({ ...settings, sha: data.sha }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        })
    } catch {
        return new Response(JSON.stringify({ enableEnglish: false }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        })
    }
}

// PUT: 更新 settings.json
export const onRequestPut = async (context: any) => {
    const { request, env } = context

    const token = env.GITHUB_TOKEN
    const owner = env.GITHUB_REPO_OWNER
    const repo = env.GITHUB_REPO_NAME

    if (!token || !owner || !repo) {
        return new Response(JSON.stringify({ error: 'Missing env vars' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const body = await request.json()
        const { content, sha, enableEnglish } = body

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

        const data = await response.json()
        return new Response(JSON.stringify({ success: true, sha: data.content.sha }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
