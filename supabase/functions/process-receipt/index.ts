export async function handler(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const imageUrl = body?.image_url;

    // This is a stubbed OCR processor. Replace with real OCR integration (Google Vision, Tesseract, etc.)
    console.log('[process-receipt] Received image URL:', imageUrl);

    // Return a dummy parsed result
    const parsed = {
      total: 1200.0,
      items: [
        { name: 'Jollof Rice', price: 500.0, quantity: 1 },
        { name: 'Soda', price: 200.0, quantity: 2 },
      ],
    };

    return new Response(JSON.stringify({ ok: true, parsed }), { status: 200 });
  } catch (err) {
    console.error('[process-receipt] error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
    });
  }
}
