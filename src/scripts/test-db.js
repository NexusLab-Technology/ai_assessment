const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-assessment-dev';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Test database operations
    const db = client.db('ai-assessment-dev');
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Test ping
    await db.admin().ping();
    console.log('🏓 Database ping successful');
    
    console.log('\n🎉 MongoDB setup is ready!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure MongoDB is running on your system');
      console.log('2. Check if MongoDB is running on port 27017');
      console.log('3. Try running: brew services start mongodb-community (on macOS)');
      console.log('4. Or install MongoDB: https://docs.mongodb.com/manual/installation/');
    }
    
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();