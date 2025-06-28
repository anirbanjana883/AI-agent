import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
// import fetch from 'node-fetch'; 
const History = [];
// const ai = new GoogleGenAI({ apiKey: "API-KEY" });


function sum({num1,num2}){
    return num1+num2;
}


function prime({num}){

    if(num<2)
        return false;

    for(let i=2;i<=Math.sqrt(num);i++)
        if(num%i==0) return false

    return true;
}


async function getCryptoPrice({coin}){

   const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`)
   const data = await response.json();

   return data;
}

const sumDeclaration = {
    name:'sum',
    description:"Get the sum of 2 number",
    parameters:{
        type:'OBJECT',
        properties:{
            num1:{
                type:'NUMBER',
                description: 'It will be First number for addition ex: 10'
            },
            num2:{
                type:'NUMBER',
                description:'It will be Second number for addition ex: 10'
            }
        },
        required: ['num1','num2']   
    }
}

const primeDeclaration = {
    name:'prime',
    description:"Get if number if prime or not",
    parameters:{
        type:'OBJECT',
        properties:{
            num:{
                type:'NUMBER',
                description: 'It will be the number to check wheather it is prime or not ex: 13'
            },
        },
        required: ['num']   
    }
}

const cryptoDeclaration = {
    name:'getCryptoPrice',
    description:"Get the current price of any crypto Currency like bitcoin",
    parameters:{
        type:'OBJECT',
        properties:{
            coin:{
                type:'STRING',
                description: 'It will be the crypto currency name, like bitcoin'
            },
        },
        required: ['coin']   
    }
}

const availableTools = {
    sum:sum,
    prime:prime,
    getCryptoPrice:getCryptoPrice,
}

async function runAgent(userProblem) {

    History.push({
        role:'user',
        parts:[{text:userProblem}]
    });

    while(true){
    
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: {
                systemInstruction: `You are an AI assistant with access to the following tools:
                1. **Sum Tool**: Calculates the sum of two numbers.
                2. **Prime Check Tool**: Checks if a number is prime.
                3. **Crypto Price Tool**: Fetches the current price of a cryptocurrency.

                ### Rules:
                - **Language Understanding**: You can process queries in **Hindi or English**, but responses must be in **English only** (add subtitles in brackets if needed).
                - **Tool Usage**: Use the tools **only when required** for accurate results (e.g., math/crypto queries). For general questions, answer directly.
                - **Output Format**: Always respond in this format:`,
            tools: [{
            functionDeclarations: [sumDeclaration,primeDeclaration,cryptoDeclaration]
            }],
            },
        });

        if(response.functionCalls&&response.functionCalls.length>0){
            
            // console.log(response.functionCalls[0]);
            const {name,args} = response.functionCalls[0];

            const funCall =  availableTools[name];
            const result = await funCall(args);

            const functionResponsePart = {
            name: name,
            response: {
                result: result,
            },
            };
        
            History.push({
            role: "model",
            parts: [
                {
                functionCall: response.functionCalls[0],
                },
            ],
            });

            History.push({
            role: "user",
            parts: [
                {
                functionResponse: functionResponsePart,
                },
            ],
            });
        }
        else{
                History.push({
                    role:'model',
                    parts:[{text:response.text}]
                })
                console.log(response.text);
                break;
        }
  }
}

async function main() {
    const userProblem = readlineSync.question("Ask me anything--> ");
    await runAgent(userProblem);
    main();
}

main()
