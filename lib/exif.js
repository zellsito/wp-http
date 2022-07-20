let fs = require('fs')
let { tmpdir } = require("os")
let Crypto = require("crypto")
let ff = require('fluent-ffmpeg')
let webp = require("node-webpmux")
let path = require("path")

/** Image To Webp
 * @param {string} media
 */
async function imageToWebp(media) {
  let tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  let tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)

  fs.writeFileSync(tmpFileIn, media)

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
	"-vcodec",
	"libwebp",
	"-vf",
	"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
      ])
      .toFormat("webp")
      .save(tmpFileOut)
  })

  let buff = fs.readFileSync(tmpFileOut)
  fs.unlinkSync(tmpFileOut)
  fs.unlinkSync(tmpFileIn)
  return buff
}

async function videoToWebp(media) {
  let tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  let tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`)

  fs.writeFileSync(tmpFileIn, media)

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
	"-vcodec",
	"libwebp",
	"-vf",
	"scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
	"-loop",
	"0",
	"-ss",
	"00:00:00",
	"-t",
	"00:00:05",
	"-preset",
	"default",
	"-an",
	"-vsync",
	"0"
      ])
      .toFormat("webp")
      .save(tmpFileOut)
  })

  let buff = fs.readFileSync(tmpFileOut)
  fs.unlinkSync(tmpFileOut)
  fs.unlinkSync(tmpFileIn)
  return buff
}

async function writeExifImg(media, metadata) {
  let wMedia = await imageToWebp(media)
  let tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  let tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  fs.writeFileSync(tmpFileIn, wMedia)

  if (metadata.packname || metadata.author) {
    let img = new webp.Image()
    let json = {
      "sticker-pack-id": `https://github.com/DikaArdnt/Hisoka-Morou`,
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      "emojis": metadata.categories ? metadata.categories : [""]
    }
    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    let jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
    let exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    await img.load(tmpFileIn)
    fs.unlinkSync(tmpFileIn)
    img.exif = exif
    await img.save(tmpFileOut)
    return tmpFileOut
  }
}

async function writeExifVid(media, metadata) {
  let wMedia = await videoToWebp(media)
  let tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  let tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  fs.writeFileSync(tmpFileIn, wMedia)

  if (metadata.packname || metadata.author) {
    let img = new webp.Image()
    let json = {
      "sticker-pack-id": `https://github.com/DikaArdnt/Hisoka-Morou`,
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      "emojis": metadata.categories ? metadata.categories : [""]
    }
    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    let jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
    let exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    await img.load(tmpFileIn)
    fs.unlinkSync(tmpFileIn)
    img.exif = exif
    await img.save(tmpFileOut)
    return tmpFileOut
  }
}

module.exports = {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid
}
