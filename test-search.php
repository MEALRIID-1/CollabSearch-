<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$aiService = new \App\Services\AiService();

$query = "laravel 12";
echo "=== TESTING DUCKDUCKGO GET ===\n";
try {
    $response = \Illuminate\Support\Facades\Http::withoutVerifying()
        ->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        ])
        ->timeout(4)
        ->get('https://html.duckduckgo.com/html/', [
            'q' => $query,
        ]);
    
    echo "Status: " . $response->status() . "\n";
    echo "Body length: " . strlen($response->body()) . "\n";
    if ($response->status() !== 200) {
        echo "Response Body: " . substr($response->body(), 0, 500) . "\n";
    }
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\n=== RUNNING searchWeb() ===\n";
echo $aiService->searchWeb($query) . "\n";
