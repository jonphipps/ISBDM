// taskmaster.config.js
module.exports = {
    tasksFile: 'specs/tasks.md',
    outputDir: '.taskmaster',
    taskPrefix: '- [ ]',
    subtaskPrefix: '  - [ ]',
    githubRepo: process.env.GITHUB_REPOSITORY || 'jonphipps/isbdm-project',
    gitBranch: 'claude-generated-components',
    progressTracking: {
        enabled: true,
        file: '.taskmaster/progress.json'
    },
    notifications: {
        onCompletion: true,
        onMilestone: true
    },
    integrations: {
        github: {
            enabled: process.env.GITHUB_TOKEN ? true : false,
            createIssues: false
        }
    },
    projectSettings: {
        css: 'sass',  // Changed from 'tailwind' to 'sass'
        frameworks: ['react'],
        packageManager: 'yarn',  // Based on your project characteristics
        languages: ['typescript', 'javascript', 'node']
    }
};