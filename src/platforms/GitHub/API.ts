import { errors } from 'platforms'

function apiRateLimitExceeded(content: any /* safe any */) {
  return content?.['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
}

function isEmptyProject(content: any /* safe any */) {
  return content?.['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: any /* safe any */) {
  return content?.['message'] === 'Repository access blocked'
}

async function request(
  url: string,
  {
    accessToken,
  }: {
    accessToken?: string
  } = {},
) {
  const headers = {} as HeadersInit & {
    Authorization?: string
  }
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }

  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    throw new Error(errors.CONNECTION_BLOCKED)
  }

  const contentType = res.headers.get('Content-Type') || res.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) {
    if (isJson) return res.json()
    throw new Error(`Response content type is "${contentType}"`)
  } else {
    if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
    else if (res.status === 403) throw new Error(errors.API_RATE_LIMIT)
    else if (res.status === 500) throw new Error(errors.SERVER_FAULT)
    else if (isJson) {
      const content = await res.json()
      if (apiRateLimitExceeded(content)) throw new Error(errors.API_RATE_LIMIT)
      if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
      if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)
      throw new Error(`Unknown message content "${content?.message}"`)
    } else {
      throw new Error(`Response content type is "${contentType}"`)
    }
  }
}

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GitHubAPI.MetaData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  accessToken?: string,
): Promise<GitHubAPI.TreeData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`
  return await request(url, { accessToken })
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GitHubAPI.BlobData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/blobs/${sha}`
  return await request(url, { accessToken })
}

export async function OAuth(code: string): Promise<string | null> {
  try {
    const endpoint = `https://gitako.now.sh/oauth/github?`
    const res = await fetch(endpoint + new URLSearchParams({ code }).toString(), {
      method: 'post',
    })
    if (res.ok) {
      const body = await res.json()
      const accessToken = body?.accessToken
      if (typeof accessToken === 'string') return accessToken
    }
    return null
  } catch (err) {
    return null
  }
}
