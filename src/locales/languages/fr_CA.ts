import type { Translation } from "@locales/translation";
import key from "@locales/keys";

export const fr_CA: Translation = {
  [key.copy_right_author]: "Auteur",
  [key.copy_right_publish_date]: "Date de publication",
  [key.copy_right_license]: "Licence",

  [key.nav_bar_home]: "Accueil",
  [key.nav_bar_archive]: "Archives",
  [key.nav_bar_about]: "À propos",
  [key.nav_bar_github]: "GitHub",
  [key.nav_bar_search_placeholder]: "Rechercher",

  [key.post_card_words]: "Mots",
  [key.post_card_minutes]: "Minutes",

  [key.side_bar_categories]: "Catégories",
  [key.side_bar_tags]: "Tags",
  [key.side_bar_view_more]: "Voir plus",

  [key.archive_year_title_count]: "Total de {{}} article(s)",

  [key.pages_categories_archive]: "Archives des articles",
  [key.pages_tags_archive]: "Archives des tags",
  [key.pages_archive_archive]: "Archives",

  [key.pages_tags_title]: "Tags",
  [key.pages_categories_title]: "Catégories",
} as Translation;
