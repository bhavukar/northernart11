const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse the local .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found at " + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    // Strip optional quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('placeholder')) {
  console.error("Error: Please verify that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correctly configured in your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function run() {
  const testPainting = {
    title: "Aura of the North",
    description: "A representation of silent Nordic landscapes, exploring the interplay of light and texture on cold canvas. Created during the peak winter in the northern plains, it features layered acrylics and natural dust elements.",
    price: 15000000, // 150,000 INR in paise (150,000.00)
    image_url: "/test-cover.png",
    additional_images: ["/test-detail-1.png", "/test-detail-2.png"],
    dimensions: "48 x 48 inches",
    medium: "Acrylic on Canvas",
    status: "available"
  };

  console.log("Connecting to Supabase at " + supabaseUrl + "...");
  console.log("Inserting test painting record...");

  const { data, error } = await supabase
    .from('paintings')
    .insert(testPainting)
    .select()
    .single();

  if (error) {
    console.error("Failed to insert painting:", error);
    process.exit(1);
  }

  console.log("\nSuccess! Test painting inserted successfully:");
  console.log("----------------------------------------------");
  console.log("ID:          " + data.id);
  console.log("Title:       " + data.title);
  console.log("Price:       " + (data.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }));
  console.log("Cover URL:   " + data.image_url);
  console.log("Gallery:     " + JSON.stringify(data.additional_images));
  console.log("----------------------------------------------");
  console.log("You can now view this listing at: http://localhost:3000/painting/" + data.id);
}

run();
