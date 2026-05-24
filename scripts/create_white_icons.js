import fs from 'fs';
import path from 'path';

const assetsDir = './assets';
const conversions = [
    { from: 'arrow_both_black_24dp.svg', to: 'arrow_both_white_24dp.svg' },
    { from: 'arrow_down_black_24dp.svg', to: 'arrow_down_white_24dp.svg' },
    { from: 'arrow_up_black_24dp.svg', to: 'arrow_up_white_24dp.svg' },
    { from: 'arrow_updown_black_24dp.svg', to: 'arrow_updown_white_24dp.svg' },
    { from: 'data_usage_black_24dp.svg', to: 'data_usage_white_24dp.svg' },
    { from: 'settings_black_24dp.svg', to: 'settings_white_24dp.svg' }
];

for (const { from, to } of conversions) {
    const fromPath = path.join(assetsDir, from);
    const toPath = path.join(assetsDir, to);
    if (!fs.existsSync(fromPath)) {
        console.log(`Source file does not exist: ${from}`);
        continue;
    }
    let content = fs.readFileSync(fromPath, 'utf8');
    
    // Replace all black color forms with white
    content = content.replace(/#000000/g, '#ffffff');
    content = content.replace(/#000/g, '#ffffff');
    content = content.replace(/fill="none"/gi, 'fill="NONE_TEMP"');
    content = content.replace(/fill="currentColor"/gi, 'fill="#ffffff"');
    
    // If there is a fill property that is black or if there is no fill (which defaults to black),
    // let's explicitly color paths/rects/svg white.
    // For safety, let's inject fill="#ffffff" into shapes that don't have it or replace black fills.
    content = content.replace(/<path\b([^>]*)/gi, (match, group) => {
        if (!group.includes('fill=')) {
            return `<path fill="#ffffff"${group}`;
        }
        return match;
    });
    content = content.replace(/<rect\b([^>]*)/gi, (match, group) => {
        if (!group.includes('fill=')) {
            return `<rect fill="#ffffff"${group}`;
        }
        return match;
    });
    
    content = content.replace(/fill="NONE_TEMP"/g, 'fill="none"');
    
    // Write the new white file
    fs.writeFileSync(toPath, content, 'utf8');
    console.log(`Created ${to} from ${from}`);
}
