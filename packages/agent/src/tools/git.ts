import { shell } from './runner.js'

interface GitInput {
  action: 'branch' | 'commit' | 'reset' | 'current_branch' | 'push_mirrors'
  branchName?: string
  commitMessage?: string
}

interface GitResult {
  success: boolean
  output: string
  branch?: string
}

export async function gitOperation(input: GitInput): Promise<GitResult> {
  const { action, branchName, commitMessage } = input

  switch (action) {
    case 'branch': {
      if (!branchName) throw new Error('branchName required for action=branch')
      const slug = branchName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const fullName = `agent/${slug}-${Date.now()}`
      const r = await shell('git.sh', ['branch', fullName])
      return { success: r.exitCode === 0, output: r.stdout + r.stderr, branch: fullName }
    }
    case 'commit': {
      if (!commitMessage) throw new Error('commitMessage required for action=commit')
      const r = await shell('git.sh', ['commit', commitMessage])
      return { success: r.exitCode === 0, output: r.stdout + r.stderr }
    }
    case 'reset': {
      const r = await shell('git.sh', ['reset'])
      return { success: r.exitCode === 0, output: r.stdout + r.stderr }
    }
    case 'current_branch': {
      const r = await shell('git.sh', ['current'])
      return { success: r.exitCode === 0, output: r.stdout.trim() }
    }
    case 'push_mirrors': {
      if (!branchName) throw new Error('branchName required for action=push_mirrors')
      const r = await shell('mirror.sh', [branchName])
      return { success: r.exitCode === 0, output: r.stdout + r.stderr }
    }
  }
}
