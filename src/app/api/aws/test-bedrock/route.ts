import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export async function POST(request: NextRequest) {
  try {
    const { accessKeyId, secretAccessKey, region } = await request.json()

    // Validate required fields
    if (!accessKeyId || !secretAccessKey || !region) {
      return NextResponse.json(
        { error: 'Missing required AWS credentials' },
        { status: 400 }
      )
    }

    // Validate AWS Access Key ID format
    if (!/^AKIA[0-9A-Z]{16}$/.test(accessKeyId)) {
      return NextResponse.json(
        { error: 'Invalid AWS Access Key ID format' },
        { status: 400 }
      )
    }

    // Create Bedrock client with provided credentials
    const bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })

    // Test connection with a simple model invocation
    // Using Claude 3 Haiku as it's cost-effective for testing
    const testPrompt = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: "Hello"
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(testPrompt)
    })

    // Attempt to invoke the model
    const response = await bedrockClient.send(command)
    
    if (response.body) {
      // If we get here, the credentials are valid and Bedrock is accessible
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to AWS Bedrock',
        region,
        modelTested: 'anthropic.claude-3-haiku-20240307-v1:0'
      })
    } else {
      return NextResponse.json(
        { error: 'Unexpected response from AWS Bedrock' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('AWS Bedrock test error:', error)

    // Handle specific AWS errors
    if (error.name === 'UnauthorizedOperation' || error.name === 'InvalidUserID.NotFound') {
      return NextResponse.json(
        { error: 'Invalid AWS credentials or insufficient permissions' },
        { status: 401 }
      )
    }

    if (error.name === 'AccessDenied') {
      return NextResponse.json(
        { error: 'Access denied. Please check your AWS permissions for Bedrock service' },
        { status: 403 }
      )
    }

    if (error.name === 'ValidationException') {
      return NextResponse.json(
        { error: 'Invalid request format or parameters' },
        { status: 400 }
      )
    }

    if (error.name === 'ModelNotReadyException') {
      return NextResponse.json(
        { error: 'Bedrock model is not available in the selected region' },
        { status: 400 }
      )
    }

    if (error.name === 'ThrottlingException') {
      return NextResponse.json(
        { error: 'Request throttled. Please try again later' },
        { status: 429 }
      )
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Network error. Please check your internet connection' },
        { status: 503 }
      )
    }

    // Generic error handling
    const errorMessage = error.message || 'Unknown error occurred while testing AWS Bedrock connection'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}