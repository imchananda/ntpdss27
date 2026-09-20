export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
      }
    }

    const { image, filename = 'boost_image.jpg', mimeType = 'image/jpeg' } = payload || {};
    if (!image) {
      return res.status(400).json({ ok: false, error: 'No image provided' });
    }

    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const safeName = filename.endsWith(ext) ? filename : `image_${Date.now()}${ext}`;

    const customHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    const fileObj = typeof File !== 'undefined'
      ? new File([buffer], safeName, { type: mimeType })
      : new Blob([buffer], { type: mimeType });

    const userhash = process.env.CATBOX_USERHASH || '';

    // Provider 1: Catbox Main (https://catbox.moe/user/api.php)
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      if (userhash) fd.append('userhash', userhash);
      fd.append('fileToUpload', fileObj, safeName);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: customHeaders,
        body: fd,
      });

      const directUrl = (await catboxRes.text()).trim();
      if (catboxRes.ok && directUrl.startsWith('http')) {
        return res.status(200).json({ ok: true, url: directUrl, provider: 'catbox' });
      }
      console.warn('Catbox upload warning:', catboxRes.status, directUrl);
    } catch (catboxErr) {
      console.warn('Catbox upload failed:', catboxErr.message);
    }

    // Provider 2: Litterbox Backup (https://litterbox.catbox.moe/resources/internals/api.php)
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('time', '72h');
      fd.append('fileToUpload', fileObj, safeName);

      const litterboxRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        headers: customHeaders,
        body: fd,
      });

      const litterUrl = (await litterboxRes.text()).trim();
      if (litterboxRes.ok && litterUrl.startsWith('http')) {
        return res.status(200).json({ ok: true, url: litterUrl, provider: 'litterbox' });
      }
    } catch (litterErr) {
      console.warn('Litterbox upload failed:', litterErr.message);
    }

    // Provider 3: FreeImage.host API
    try {
      const fd = new FormData();
      fd.append('key', '6d207e02198a847aa98d0a2a901485a5');
      fd.append('action', 'upload');
      fd.append('source', base64Data);
      fd.append('format', 'json');

      const freeImgRes = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: fd,
      });

      const freeJson = await freeImgRes.json();
      if (freeImgRes.ok && freeJson?.image?.url) {
        return res.status(200).json({ ok: true, url: freeJson.image.url, provider: 'freeimage' });
      }
    } catch (freeErr) {
      console.warn('FreeImage upload failed:', freeErr.message);
    }

    // Fallback: If all external providers fail, return compressed Data URL directly
    // This ensures image uploads NEVER block the user or fail completely.
    const dataUrl = image.startsWith('data:') ? image : `data:${mimeType};base64,${base64Data}`;
    return res.status(200).json({
      ok: true,
      url: dataUrl,
      provider: 'base64_fallback',
      warning: 'อัปโหลดภาพผ่าน Data URL สำเร็จ (เนื่องจากเซิร์ฟเวอร์ฝากรูปภายนอกขัดข้องชั่วคราว)',
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
