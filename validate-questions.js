/**
 * Question Validation Script
 * Doctor Mays' Birthday Quest
 * 
 * Run with: node validate-questions.js
 * Or open in browser with the game
 */

(async function validateQuestions() {
    // Load config
    let config;

    if (typeof window !== 'undefined') {
        // Browser environment
        const response = await fetch('gameConfig.json');
        config = await response.json();
    } else {
        // Node.js environment
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, 'gameConfig.json');
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    console.log('=== Question Validation Report ===\n');

    const complete = [];
    const needsMedia = [];
    const disabled = [];
    const draft = [];

    // Check each category
    config.categories.forEach(category => {
        category.questions.forEach(question => {
            const info = {
                id: question.id,
                category: category.name,
                text: question.text.substring(0, 50) + '...',
                status: question.status,
                enabled: question.enabled
            };

            if (!question.enabled) {
                disabled.push(info);
            } else if (question.status === 'complete') {
                complete.push(info);
            } else if (question.status === 'needs-media') {
                // Check what media is needed
                const needed = [];
                if (question.requiredMedia) {
                    Object.entries(question.requiredMedia).forEach(([type, req]) => {
                        if (req && req.needed) {
                            needed.push(`${type.toUpperCase()}: "${req.description}"`);
                        }
                    });
                }
                info.neededMedia = needed;
                needsMedia.push(info);
            } else if (question.status === 'draft') {
                draft.push(info);
            }
        });
    });

    // Report complete questions
    console.log(`COMPLETE (${complete.length} questions ready)`);
    complete.forEach(q => console.log(`   - ${q.id} [${q.category}]`));
    console.log('');

    // Report needs-media
    if (needsMedia.length > 0) {
        console.log(`NEEDS MEDIA (${needsMedia.length} questions awaiting assets)`);
        needsMedia.forEach(q => {
            console.log(`   - ${q.id}: Missing:`);
            q.neededMedia.forEach(m => console.log(`      -> ${m}`));
        });
        console.log('');
    }

    // Report drafts
    if (draft.length > 0) {
        console.log(`DRAFT (${draft.length} questions need review)`);
        draft.forEach(q => console.log(`   - ${q.id} [${q.category}]`));
        console.log('');
    }

    // Report disabled
    if (disabled.length > 0) {
        console.log(`DISABLED (${disabled.length} questions manually disabled)`);
        disabled.forEach(q => console.log(`   - ${q.id} [${q.category}]`));
        console.log('');
    }

    // Summary
    const total = complete.length + needsMedia.length + draft.length + disabled.length;
    const readyPercent = Math.round((complete.length / total) * 100);
    console.log(`Summary: ${complete.length}/${total} questions ready (${readyPercent}%)`);

    // Category breakdown
    console.log('\n=== Category Breakdown ===');
    config.categories.forEach(cat => {
        const catComplete = cat.questions.filter(q => q.enabled && q.status === 'complete').length;
        const catTotal = cat.questions.length;
        console.log(`${cat.icon} ${cat.name}: ${catComplete}/${catTotal}`);
    });

    // Asset check (Node.js only)
    if (typeof window === 'undefined') {
        const fs = require('fs');
        const path = require('path');

        console.log('\n=== Asset Check ===');

        // Check character images
        const charDir = path.join(__dirname, 'assets', 'characters');
        const characters = config.characters;

        console.log('\nCharacter Images:');
        characters.forEach(char => {
            const imgPath = path.join(__dirname, char.imagePath);
            const exists = fs.existsSync(imgPath);
            console.log(`   ${exists ? 'OK' : 'MISSING'} ${char.name}: ${char.imagePath}`);
        });

        // Check story images
        const storyDir = path.join(__dirname, 'assets', 'story');
        if (fs.existsSync(storyDir)) {
            const storyFiles = fs.readdirSync(storyDir);
            console.log(`\nStory Images: ${storyFiles.length} files found`);
            storyFiles.forEach(f => console.log(`   - ${f}`));
        }
    }

    console.log('\n=== Validation Complete ===');

    return {
        complete: complete.length,
        needsMedia: needsMedia.length,
        draft: draft.length,
        disabled: disabled.length,
        total: total,
        readyPercent: readyPercent
    };
})();
