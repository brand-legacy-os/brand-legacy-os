-- PodcastEpisode: campo de texto livre para responsável "Outros" por etapa
ALTER TABLE "PodcastEpisode" ADD COLUMN "recordingResponsibleOther" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "materialResponsibleOther" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "postResponsibleOther" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "dispatchResponsibleOther" TEXT;
