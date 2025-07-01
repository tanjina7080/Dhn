const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/api/edit", async (req, res) => {
  const { url, txt } = req.query;

  if (!url || !txt) {
    return res.status(400).json({ error: "Missing image URL or prompt" });
  }

  try {
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "db21e45e1d5e55d661f6c61112a63e91fdbb8e7088e8b6d4d6b6b717b4c120a1",
        input: {
          image: url,
          prompt: txt,
          strength: 0.8,
          guidance_scale: 7.5
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const getResultUrl = response.data.urls.get;
    let outputUrl = null;

    while (!outputUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await axios.get(getResultUrl, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      if (result.data.status === "succeeded") {
        outputUrl = result.data.output[0];
      }
    }

    const imageResp = await axios.get(outputUrl, { responseType: "arraybuffer" });
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageResp.data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image editing failed." });
  }
});

app.listen(port, () => {
  console.log(`Image editing API running on port ${port}`);
});
