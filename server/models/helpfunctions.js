import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';





// generate/helpfunction.js
export function generateCode() {
    // reade the JSON file from response.json

    fs.readFile('response.json', 'utf8', (err, data) => {
        // console the keys
        const jsonData = JSON.parse(data);
        const { exec } = require('child_process');
        for (const key in jsonData) {
            if (!key.includes('.')) {
                exec(`mkdir generate/${key}`, (error, stdout, stderr) => {});
                jsonData[key].forEach(file => {
                    exec(`touch generate/${key}/${file['name']}`, (error, stdout, stderr) => {});
                    // exec(`echo ${file['content']} > generate/${key}/${file['name']}`, (error, stdout, stderr) => {});
                    fs.writeFile(`generate/${key}/${file['name']}`, `${file['content']}`, 'utf8', (err) => {});
                });

            }else{
                exec(`touch generate/${key}`, (error, stdout, stderr) => {});
                const filePath = `generate/${key}`;
                const content = typeof jsonData[key] === 'object'
                    ? JSON.stringify(jsonData[key], null, 2)
                    : jsonData[key];
                
                fs.writeFile(filePath, content, 'utf8', (err) => {});
            }
        }
        
    });
    const open = require('open'); // Install with `npm install open`
    const { exec } = require('child_process');
    
    // Step 1: Install dependencies
    exec('cd generate && npm install', (installErr, installStdout, installStderr) => {
        if (installErr) {
            console.error('Error installing dependencies:', installStderr);
            return;
        }
        console.log('Dependencies installed.');
    
        // Step 2: Start the app
        const appProcess = exec('node generate/app.js', (appErr, appStdout, appStderr) => {
            if (appErr) {
                console.error('Error running app:', appStderr);
                return;
            }
        });
    
        // Step 3: Wait a moment, then open browser (or check server is up, ideally)
        setTimeout(() => {
            // open('http://localhost:3000'); // Change to your app's actual URL/port
        }, 30000); // Wait 3 seconds (adjust as needed)
    });
}

export async function generatefiles() {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    try {

        // gloval variable jasonData
        const jsonData = JSON.parse(fs.readFileSync('response.json', 'utf8'));
        // Function to create directories and files
        async function createStructure(basePath, structure) {
            for (const key in structure) {
                const currentPath = path.join(basePath, key);

                if (typeof structure[key] === 'object' && !key.includes('.')) {
                    fs.mkdirSync(currentPath, { recursive: true });
                    await createStructure(currentPath, structure[key]);
                } else {
                    fs.writeFileSync(currentPath, structure[key], 'utf8');
                }
            }
        }

        // Create the generate folder and structure
        const generatePath = path.join(__dirname, 'generate');
        fs.mkdirSync(generatePath, { recursive: true });

        await createStructure(generatePath, jsonData.root);


        // Automatically install dependencies
        exec('cd generate && npm install', (err, stdout, stderr) => {
            if (err) {
                console.error('Error installing dependencies:', stderr);
                return;
            }
            console.log('Dependencies installed.');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}



