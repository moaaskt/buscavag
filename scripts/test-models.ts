import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = new GoogleGenAI({ apiKey });
  
  try {
    const response = await client.models.list();
    for (const model of response) {
        if (model.name.includes('flash')) {
            console.log(model.name);
        }
    }
  } catch (err) {
    console.error(err);
  }
}
run();
