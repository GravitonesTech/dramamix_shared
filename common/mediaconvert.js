const { MediaConvertClient, CreateJobCommand, GetJobCommand } = require("@aws-sdk/client-mediaconvert");
const { getCdnUrl } = require("./s3");

let client = null;

function getClient() {
  if (client) return client;
  const endpoint = process.env.MEDIACONVERT_ENDPOINT;
  if (!endpoint) throw new Error("MEDIACONVERT_ENDPOINT environment variable is not set");
  client = new MediaConvertClient({
    region: process.env.AWS_REGION,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

function buildHlsJobSettings(inputS3Uri, outputS3Uri) {
  return {
    Inputs: [
      {
        FileInput: inputS3Uri,
        AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
        VideoSelector: {},
        TimecodeSource: "ZEROBASED",
      },
    ],
    OutputGroups: [
      {
        Name: "HLS Group",
        OutputGroupSettings: {
          Type: "HLS_GROUP_SETTINGS",
          HlsGroupSettings: {
            SegmentLength: 6,
            MinSegmentLength: 0,
            Destination: outputS3Uri,
            DirectoryStructure: "SINGLE_DIRECTORY",
            ManifestCompression: "NONE",
            ManifestDurationFormat: "INTEGER",
            StreamInfResolution: "INCLUDE",
            CodecSpecification: "RFC_4281",
          },
        },
        Outputs: [
          {
            NameModifier: "_1080p",
            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
            VideoDescription: {
              Width: 1920,
              Height: 1080,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 5000000,
                  RateControlMode: "CBR",
                  GopSize: 90,
                  GopSizeUnits: "FRAMES",
                  CodecProfile: "HIGH",
                  CodecLevel: "AUTO",
                  SceneChangeDetect: "ENABLED",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 128000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                },
              },
            ],
          },
          {
            NameModifier: "_480p",
            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
            VideoDescription: {
              Width: 854,
              Height: 480,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 1000000,
                  RateControlMode: "CBR",
                  GopSize: 90,
                  GopSizeUnits: "FRAMES",
                  CodecProfile: "MAIN",
                  CodecLevel: "AUTO",
                  SceneChangeDetect: "ENABLED",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 96000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                },
              },
            ],
          },
          {
            NameModifier: "_720p",
            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
            VideoDescription: {
              Width: 1280,
              Height: 720,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 2500000,
                  RateControlMode: "CBR",
                  GopSize: 90,
                  GopSizeUnits: "FRAMES",
                  CodecProfile: "HIGH",
                  CodecLevel: "AUTO",
                  SceneChangeDetect: "ENABLED",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 96000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                },
              },
            ],
          },
          {
            NameModifier: "_360p",
            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
            VideoDescription: {
              Width: 640,
              Height: 360,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 800000,
                  RateControlMode: "CBR",
                  GopSize: 90,
                  GopSizeUnits: "FRAMES",
                  CodecProfile: "MAIN",
                  CodecLevel: "AUTO",
                  SceneChangeDetect: "ENABLED",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 64000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                },
              },
            ],
          },
        ],
      },
    ],
    TimecodeConfig: { Source: "ZEROBASED" },
  };
}

async function submitTranscodeJob({ episodeId, rawS3Key }) {
  const bucket = process.env.AWS_S3_BUCKET;
  const roleArn = process.env.MEDIACONVERT_ROLE_ARN;

  if (!roleArn) throw new Error("MEDIACONVERT_ROLE_ARN environment variable is not set");

  const inputS3Uri = `s3://${bucket}/${rawS3Key}`;
  const outputFolder = `hls/episode-${episodeId}`;
  const outputS3Uri = `s3://${bucket}/${outputFolder}/`;

  const command = new CreateJobCommand({
    Role: roleArn,
    Settings: buildHlsJobSettings(inputS3Uri, outputS3Uri),
    UserMetadata: {
      episodeId: String(episodeId),
      outputFolder,
    },
    StatusUpdateInterval: "SECONDS_60",
  });

  const response = await getClient().send(command);
  const jobId = response.Job.Id;
  const hlsMasterKey = `${outputFolder}/master.m3u8`;
  const hlsCdnUrl = getCdnUrl(hlsMasterKey);

  return { jobId, hlsCdnUrl, outputFolder };
}

async function getJobStatus(jobId) {
  const command = new GetJobCommand({ Id: jobId });
  const response = await getClient().send(command);
  return {
    status: response.Job.Status,
    errorMessage: response.Job.ErrorMessage || null,
    progressPercent: response.Job.JobPercentComplete || 0,
  };
}

function buildEncryptedHlsJobSettings(inputS3Uri, outputS3Uri, aesKeyHex, aesKeyIv, aesKeyUrl) {
  const base = buildHlsJobSettings(inputS3Uri, outputS3Uri);
  const hlsSettings = base.OutputGroups[0].OutputGroupSettings.HlsGroupSettings;

  hlsSettings.Encryption = {
    EncryptionMethod: "AES128",
    StaticKeyProvider: {
      StaticKeyValue: aesKeyHex,
      Url: aesKeyUrl,
    },
    InitializationVectorInManifest: "INCLUDE",
    ConstantInitializationVector: aesKeyIv,
  };

  return base;
}

async function submitEncryptedTranscodeJob({ episodeId, rawS3Key, aesKeyHex, aesKeyIv, aesKeyUrl }) {
  const bucket = process.env.AWS_S3_BUCKET;
  const roleArn = process.env.MEDIACONVERT_ROLE_ARN;

  if (!roleArn) throw new Error("MEDIACONVERT_ROLE_ARN environment variable is not set");
  if (!aesKeyHex || !aesKeyIv || !aesKeyUrl) throw new Error("AES key parameters are required for encrypted transcoding");

  const inputS3Uri = `s3://${bucket}/${rawS3Key}`;
  const outputFolder = `hls/episode-${episodeId}-drm`;
  const outputS3Uri = `s3://${bucket}/${outputFolder}/`;

  const command = new CreateJobCommand({
    Role: roleArn,
    Settings: buildEncryptedHlsJobSettings(inputS3Uri, outputS3Uri, aesKeyHex, aesKeyIv, aesKeyUrl),
    UserMetadata: {
      episodeId: String(episodeId),
      outputFolder,
      encrypted: "true",
    },
    StatusUpdateInterval: "SECONDS_60",
  });

  const response = await getClient().send(command);
  const jobId = response.Job.Id;
  const hlsMasterKey = `${outputFolder}/master.m3u8`;
  const hlsCdnUrl = getCdnUrl(hlsMasterKey);

  return { jobId, hlsCdnUrl, outputFolder };
}

module.exports = { submitTranscodeJob, submitEncryptedTranscodeJob, getJobStatus };
