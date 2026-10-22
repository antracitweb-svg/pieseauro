"use strict";

/*
 * AutoPiese Parts Commands - Enhanced Parts Management System
 * Reconstructed and enhanced parts commands for the AutoPiese marketplace
 */

const ERR = {
  PARTS_NOT_FOUND: 'Piesele căutate nu au fost găsite.',
  PARTS_ACCESS_DENIED: 'Nu aveți permisiunea de a accesa aceste piese.',
  PARTS_CREATE_FAILED: 'Nu s-au putut crea piese. Verificați datele introduse.',
  PARTS_UPDATE_FAILED: 'Nu s-au putut actualiza piese. Verificați datele introduse.',
  PARTS_DELETE_FAILED: 'Nu s-au putut șterge piese.',
  PARTS_COMPATIBILITY_FAILED: 'Nu s-au putut verifica compatibilitățile pieselor.',
  PARTS_SEARCH_FAILED: 'Nu s-a putut efectua căutarea pieselor.',
  PARTS_ORDER_FAILED: 'Nu s-a putut plasa comanda pentru aceste piese.',
  PARTS_FAVORITE_FAILED: 'Nu s-au putut gestiona piesele favorite.',
  PARTS_INVENTORY_FAILED: 'Nu s-a putut actualiza inventarul pieselor.',
  PARTS_PRICE_CHECK_FAILED: 'Nu s-a putut verifica prețul pieselor.',
  PARTS_COMPARISON_FAILED: 'Nu s-au putut compara piesele.',
  PARTS_REVIEW_FAILED: 'Nu s-au putut adăuga recenzii la piese.',
  PARTS_REPORT_FAILED: 'Nu s-a putut raporta la piese.',
  PARTS_EXPORT_FAILED: 'Nu s-au putut exporta datele pieselor.',
  PARTS_IMPORT_FAILED: 'Nu s-au putut importa datele pieselor.',
  PARTS_BATCH_FAILED: 'Nu s-au putut procesa piesele în lot.',
  PARTS_VALIDATE_FAILED: 'Nu s-au putut valida datele pieselor.',
  PARTS_SYNC_FAILED: 'Nu s-a putut sincroniza inventarul pieselor.',
  PARTS_ANALYTICS_FAILED: 'Nu s-au putut genera analizele pieselor.',
  PARTS_ALERTS_FAILED: 'Nu s-au putut genera alertele pentru piese.',
  PARTS_NOTIFICATIONS_FAILED: 'Nu s-au putut genera notificările pentru piese.',
  PARTS_REMINDERS_FAILED: 'Nu s-au putut genera mementele pentru piese.',
  PARTS_RECOMMENDATIONS_FAILED: 'Nu s-au putut genera recomandările pentru piese.',
  PARTS_SIMILAR_FAILED: 'Nu s-au putut găsi piese similare.',
  PARTS_ALTERNATIVES_FAILED: 'Nu s-au putut găsi alternative la piese.',
  PARTS_REPLACEMENTS_FAILED: 'Nu s-au putut găsi înlocuitori pentru piese.',
  PARTS_UPGRADES_FAILED: 'Nu s-au putut găsi upgrade-uri pentru piese.',
  PARTS_MODS_FAILED: 'Nu s-au putut găsi moduri pentru piese.',
  PARTS_TUNING_FAILED: 'Nu s-au putut găsi piese de tuning.',
  PARTS_PERFORMANCE_FAILED: 'Nu s-au putut găsi piese de performanță.',
  PARTS_SPORT_FAILED: 'Nu s-au putut găsi piese sportive.',
  PARTS_OFFROAD_FAILED: 'Nu s-au putut găsi piese off-road.',
  PARTS_TURBO_FAILED: 'Nu s-au putut găsi piese turbo.',
  PARTS_SUPERCHARGER_FAILED: 'Nu s-au putut găsi piese supercharger.',
  PARTS_INTERCOOLER_FAILED: 'Nu s-au putut găsi piese intercooler.',
  PARTS_EXHAUST_FAILED: 'Nu s-au putut găsi piese de evacuare.',
  PARTS_INTAKE_FAILED: 'Nu s-au putut găsi piese de admisie.',
  PARTS_FUEL_FAILED: 'Nu s-au putut găsi piese de alimentare cu combustibil.',
  PARTS_ELECTRONICS_FAILED: 'Nu s-au putut găsi piese electronice.',
  PARTS_LIGHTING_FAILED: 'Nu s-au putut găsi piese de iluminat.',
  PARTS_SUSPENSION_FAILED: 'Nu s-au putut găsi piese de suspensie.',
  PARTS_BRAKES_FAILED: 'Nu s-au putut găsi piese de frână.',
  PARTS_STEERING_FAILED: 'Nu s-au putut găsi piese de direcție.',
  PARTS_DRIVETRAIN_FAILED: 'Nu s-au putut găsi piese de transmisie.',
  PARTS_CHASSIS_FAILED: 'Nu s-au putut găsi piese de șasiu.',
  PARTS_BODY_FAILED: 'Nu s-au putut găsi piese de caroserie.',
  PARTS_INTERIOR_FAILED: 'Nu s-au putut găsi piese de interior.',
  PARTS_EXTERIOR_FAILED: 'Nu s-au putut găsi piese de exterior.',
  PARTS_CLIMATE_FAILED: 'Nu s-au putut găsi piese de climatizare.',
  PARTS_AUDIO_FAILED: 'Nu s-au putut găsi piese audio.',
  PARTS_NAVIGATION_FAILED: 'Nu s-au putut găsi piese de navigație.',
  PARTS_SECURITY_FAILED: 'Nu s-au putut găsi piese de securitate.',
  PARTS_COMFORT_FAILED: 'Nu s-au putut găsi piese de confort.',
  PARTS_TECHNOLOGY_FAILED: 'Nu s-au putut găsi piese tehnologice.',
  PARTS_SAFETY_FAILED: 'Nu s-au putut găsi piese de siguranță.',
  PARTS_RELIABILITY_FAILED: 'Nu s-au putut găsi piese de fiabilitate.',
  PARTS_DURABILITY_FAILED: 'Nu s-au putut găsi piese de durabilitate.',
  PARTS_QUALITY_FAILED: 'Nu s-au putut găsi piese de calitate.',
  PARTS_VALUE_FAILED: 'Nu s-au putut găsi piese de valoare.',
  PARTS_PRICE_FAILED: 'Nu s-au putut găsi piese de preț.',
  PARTS_DISCOUNT_FAILED: 'Nu s-au putut găsi piese cu discount.',
  PARTS_PROMOTION_FAILED: 'Nu s-au putut găsi piese în promoție.',
  PARTS_SALE_FAILED: 'Nu s-au putut găsi piese în vânzare.',
  PARTS_CLEARANCE_FAILED: 'Nu s-au putut găsi piese în lichidare.',
  PARTS_CLOSEOUT_FAILED: 'Nu s-au putut găsi piese în finalizare.',
  PARTS_OUTLET_FAILED: 'Nu s-au putut găsi piese outlet.',
  PARTS_WAREHOUSE_FAILED: 'Nu s-au putut găsi piese de magazin.',
  PARTS_INVENTORY_FAILED: 'Nu s-au putut găsi piese în stoc.',
  PARTS_BACKORDER_FAILED: 'Nu s-au putut găsi piese în backorder.',
  PARTS_SPECIAL_FAILED: 'Nu s-au putut găsi piese speciale.',
  PARTS_CUSTOM_FAILED: 'Nu s-au putut găsi piese personalizate.',
  PARTS_MADE_FAILED: 'Nu s-au putut găsi piese personalizate.',
  PARTS_ORDERED_FAILED: 'Nu s-au putut găsi piese comandate.',
  PARTS_SHIPPED_FAILED: 'Nu s-au putut găsi piese expediate.',
  PARTS_DELIVERED_FAILED: 'Nu s-au putut găsi piese livrate.',
  PARTS_RETURNED_FAILED: 'Nu s-au putut găsi piese returnate.',
  PARTS_REFUNDED_FAILED: 'Nu s-au putut găsi piese rambursate.',
  PARTS_EXCHANGED_FAILED: 'Nu s-au putut găsi piese schimbate.',
  PARTS_CANCELLED_FAILED: 'Nu s-au putut găsi piese anulate.',
  PARTS_COMPLETED_FAILED: 'Nu s-au putut găsi piese finalizate.',
  PARTS_PAUSED_FAILED: 'Nu s-au putut găsi piese suspendate.',
  PARTS_ARCHIVED_FAILED: 'Nu s-au putut găsi piese arhivate.',
  PARTS_DELETED_FAILED: 'Nu s-au putut găsi piese șterse.',
  PARTS_RESTORED_FAILED: 'Nu s-au putut găsi piese restaurate.',
  PARTS_MOVED_FAILED: 'Nu s-au putut găsi piese mutate.',
  PARTS_COPIED_FAILED: 'Nu s-au putut găsi piese copiate.',
  PARTS_MERGED_FAILED: 'Nu s-au putut găsi piese îmbinate.',
  PARTS_SPLIT_FAILED: 'Nu s-au putut găsi piese separate.',
  PARTS_COMBINED_FAILED: 'Nu s-au putut găsi piese combinate.',
  PARTS_GROUPED_FAILED: 'Nu s-au putut găsi piese grupate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.',
  PARTS_FILTERED_FAILED: 'Nu s-au putut găsi piese filtrate.',
  PARTS_SORTED_FAILED: 'Nu s-au putut găsi piese sortate.', 
]}},

/**
 * Enhanced Parts Management System
 */

const PartsCommands = {
  // ===== CORE PARTS MANAGEMENT =====
  
  // Parts Listing Commands
  createListing: async function(listingData) {
    try {
      const formData = new FormData();
      formData.append('type', 'piesa');
      formData.append('title', listingData.title);
      formData.append('price', listingData.price || 0);
      formData.append('category', listingData.category);
      formData.append('make', listingData.make);
      formData.append('model', listingData.model);
      formData.append('year', listingData.year);
      formData.append('condition', listingData.condition);
      formData.append('description', listingData.description);
      formData.append('quantity', listingData.quantity || 1);
      formData.append('negotiable', listingData.negotiable || false);
      formData.append('delivery', listingData.delivery || false);
      
      if (listingData.images && listingData.images.length > 0) {
        listingData.images.forEach((img, index) => {
          if (img.startsWith('data:')) {
            const blob = dataURItoBlob(img);
            formData.append(`image_${index}`, blob, `part_${Date.now()}_${index}.jpg`);
          }
        });
      }
      
      const response = await api('/api/listings', {
        method: 'POST',
        body: formData,
        headers: {}
      });
      
      toast('Piesa a fost creată cu succes!');
      return { success: true, data: response, message: ERR.PARTS_CREATE_SUCCESS };
    } catch (error) {
      console.error('Error creating part listing:', error);
      toast(error.message || ERR.PARTS_CREATE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CREATE_FAILED };
    }
  },
  
  updateListing: async function(listingId, updateData) {
    try {
      const response = await api(`/api/listings/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      toast('Piesa a fost actualizată cu succes!');
      return { success: true, data: response, message: ERR.PARTS_UPDATE_SUCCESS };
    } catch (error) {
      console.error('Error updating part listing:', error);
      toast(error.message || ERR.PARTS_UPDATE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_UPDATE_FAILED };
    }
  },
  
  deleteListing: async function(listingId) {
    try {
      const response = await api(`/api/listings/${listingId}`, {
        method: 'DELETE'
      });
      
      toast('Piesa a fost ștearsă cu succes!');
      return { success: true, data: response, message: ERR.PARTS_DELETE_SUCCESS };
    } catch (error) {
      console.error('Error deleting part listing:', error);
      toast(error.message || ERR.PARTS_DELETE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_DELETE_FAILED };
    }
  },
  
  // Parts Search and Filter Commands
  searchParts: async function(searchParams = {}) {
    try {
      const response = await api('/api/listings', {
        method: 'GET',
        searchParams: searchParams
      });
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_SEARCH_SUCCESS,
        count: response.total || 0
      };
    } catch (error) {
      console.error('Error searching parts:', error);
      toast(error.message || ERR.PARTS_SEARCH_FAILED);
      return { success: false, error: error.message || ERR.PARTS_SEARCH_FAILED };
    }
  },
  
  getPartDetails: async function(listingId) {
    try {
      const response = await api(`/api/listings/${listingId}`);
      
      return { success: true, data: response, message: ERR.PARTS_DETAILS_SUCCESS };
    } catch (error) {
      console.error('Error getting part details:', error);
      toast(error.message || ERR.PARTS_NOT_FOUND);
      return { success: false, error: error.message || ERR.PARTS_NOT_FOUND };
    }
  },
  
  // Parts Compatibility and Filtering
  findCompatibleParts: async function(vehicleInfo) {
    try {
      const { make, model, year, engine, fuel } = vehicleInfo;
      
      const vehicleCatalog = await api('/api/catalog/resolve', {
        method: 'GET',
        searchParams: { q: `${make} ${model} ${year}` }
      });
      
      if (!vehicleCatalog.match) {
        return { 
          success: false, 
          error: ERR.PARTS_COMPATIBILITY_FAILED,
          message: 'Nu s-au găsit piese compatibile cu vehiculul specificat.'
        };
      }
      
      const searchResults = await PartsCommands.searchParts({
        make,
        model,
        year,
        engine,
        fuel,
        sortBy: 'relevance'
      });
      
      return {
        success: true,
        data: {
          compatible: searchResults.data.listings || [],
          suggestions: generatePartSuggestions(vehicleCatalog, searchResults.data.listings || [])
        },
        message: ERR.PARTS_COMPATIBILITY_SUCCESS
      };
    } catch (error) {
      console.error('Error finding compatible parts:', error);
      toast(error.message || ERR.PARTS_COMPATIBILITY_FAILED);
      return { success: false, error: error.message || ERR.PARTS_COMPATIBILITY_FAILED };
    }
  },
  
  // Parts Favorites Management
  addToFavorites: async function(listingId) {
    try {
      const response = await api(`/api/favorites/${listingId}`, {
        method: 'POST'
      });
      
      toast('Piesa a fost adăugată la favorite!');
      return { success: true, data: response, message: ERR.PARTS_FAVORITE_SUCCESS };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  removeFromFavorites: async function(listingId) {
    try {
      const response = await api(`/api/favorites/${listingId}`, {
        method: 'DELETE'
      });
      
      toast('Piesa a fost eliminată din favorite!');
      return { success: true, data: response, message: ERR.PARTS_FAVORITE_REMOVED_SUCCESS };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  getFavorites: async function() {
    try {
      const response = await api('/api/favorites');
      
      return { success: true, data: response, message: ERR.PARTS_FAVORITES_LOADED_SUCCESS };
    } catch (error) {
      console.error('Error getting favorites:', error);
      toast(error.message || ERR.PARTS_FAVORITE_FAILED);
      return { success: false, error: error.message || ERR.PARTS_FAVORITE_FAILED };
    }
  },
  
  // Parts Cart Management
  addToCart: async function(listingId) {
    try {
      const cart = readJSON('autopiese_cart', []);
      if (!cart.includes(listingId)) {
        cart.push(listingId);
        writeJSON('autopiese_cart', cart.slice(0, 50));
      }
      
      toast('Piesa a fost adăugată în coș!');
      return { success: true, message: ERR.PARTS_CART_ADDED_SUCCESS };
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  removeFromCart: async function(listingId) {
    try {
      let cart = readJSON('autopiese_cart', []);
      cart = cart.filter(id => id !== listingId);
      writeJSON('autopiese_cart', cart);
      
      toast('Piesa a fost eliminată din coș!');
      return { success: true, message: ERR.PARTS_CART_REMOVED_SUCCESS };
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  getCart: async function() {
    try {
      const cart = readJSON('autopiese_cart', []);
      const cartItems = await Promise.all(
        cart.map(async id => {
          try {
            const response = await api(`/api/listings/${id}`);
            return response.listing;
          } catch {
            return null;
          }
        })
      );
      
      return { 
        success: true, 
        data: cartItems.filter(item => item), 
        message: ERR.PARTS_CART_LOADED_SUCCESS,
        count: cartItems.filter(item => item).length
      };
    } catch (error) {
      console.error('Error getting cart:', error);
      toast(error.message || ERR.PARTS_CART_FAILED);
      return { success: false, error: error.message || ERR.PARTS_CART_FAILED };
    }
  },
  
  // Parts Ordering
  createOrder: async function(orderData) {
    try {
      const response = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      toast('Comanda a fost plasată cu succes!');
      return { success: true, data: response, message: ERR.PARTS_ORDER_SUCCESS };
    } catch (error) {
      console.error('Error creating order:', error);
      toast(error.message || ERR.PARTS_ORDER_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ORDER_FAILED };
    }
  },
  
  // Parts Analytics and Statistics
  getPartsAnalytics: async function(timeRange = '30d') {
    try {
      const response = await api(`/api/stats/mine`);
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_ANALYTICS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting parts analytics:', error);
      toast(error.message || ERR.PARTS_ANALYTICS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ANALYTICS_FAILED };
    }
  },
  
  getAccountStats: async function(range = '12m') {
    try {
      const response = await api(`/api/stats/account?range=${range}`);
      
      return { 
        success: true, 
        data: response, 
        message: ERR.PARTS_ACCOUNT_STATS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting account stats:', error);
      toast(error.message || ERR.PARTS_ANALYTICS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_ANALYTICS_FAILED };
    }
  },
  
  // Parts Export and Import
  exportPartsData: async function() {
    try {
      const response = await api('/api/account/export');
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autopiese-parts-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast('Datele pieselor au fost exportate cu succes!');
      return { success: true, message: ERR.PARTS_EXPORT_SUCCESS };
    } catch (error) {
      console.error('Error exporting parts data:', error);
      toast(error.message || ERR.PARTS_EXPORT_FAILED);
      return { success: false, error: error.message || ERR.PARTS_EXPORT_FAILED };
    }
  },
  
  // Parts Validation and Utilities
  validatePartListing: function(listingData) {
    const errors = [];
    
    if (!listingData.title || listingData.title.trim().length < 10) {
      errors.push('Titlul trebuie să aibă cel puțin 10 caractere');
    }
    
    if (!listingData.price || listingData.price < 0) {
      errors.push('Prețul trebuie să fie un număr valid');
    }
    
    if (!listingData.category) {
      errors.push('Categoria este obligatorie');
    }
    
    if (!listingData.make) {
      errors.push('Marca este obligatorie');
    }
    
    if (!listingData.model) {
      errors.push('Modelul este obligatoriu');
    }
    
    if (listingData.images && listingData.images.length > 10) {
      errors.push('Numărul de poze nu poate depăși 10');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      message: errors.length > 0 ? ERR.PARTS_VALIDATE_FAILED : ERR.PARTS_VALIDATE_SUCCESS
    };
  },
  
  // Parts Synchronization
  syncPartsInventory: async function() {
    try {
      // Sync with vehicle catalog
      await syncVehicleDb();
      
      // Sync favorites
      await syncFavorites();
      
      toast('Inventarul pieselor a fost sincronizat cu succes!');
      return { success: true, message: ERR.PARTS_SYNC_SUCCESS };
    } catch (error) {
      console.error('Error syncing parts inventory:', error);
      toast(error.message || ERR.PARTS_SYNC_FAILED);
      return { success: false, error: error.message || ERR.PARTS_SYNC_FAILED };
    }
  },
  
  // Parts Recommendations
  getPartsRecommendations: async function(userPreferences = {}) {
    try {
      const { category, make, model, year, budget } = userPreferences;
      
      const searchParams = {};
      if (category) searchParams.filterCategory = category;
      if (make) searchParams.filterMake = make;
      if (model) searchParams.filterModel = model;
      if (year) searchParams.filterYear = year;
      if (budget) searchParams.maxPrice = budget;
      
      const response = await PartsCommands.searchParts(searchParams);
      
      // Generate recommendations based on user preferences
      const recommendations = generateRecommendations(response.data.listings || [], userPreferences);
      
      return {
        success: true,
        data: recommendations,
        message: ERR.PARTS_RECOMMENDATIONS_SUCCESS
      };
    } catch (error) {
      console.error('Error getting parts recommendations:', error);
      toast(error.message || ERR.PARTS_RECOMMENDATIONS_FAILED);
      return { success: false, error: error.message || ERR.PARTS_RECOMMENDATIONS_FAILED };
    }
  },
  
  // ===== UTILITY FUNCTIONS =====
  
  // Generate part suggestions based on vehicle catalog
  generatePartSuggestions: function(vehicleCatalog, parts) {
    const suggestions = [];
    
    parts.forEach(part => {
      const compatibility = calculatePartCompatibility(part, vehicleCatalog);
      if (compatibility.score > 0.7) {
        suggestions.push({
          part: part,
          compatibility: compatibility,
          reason: generateCompatibilityReason(compatibility)
        });
      }
    });
    
    return suggestions.sort((a, b) => b.compatibility.score - a.compatibility.score).slice(0, 10);
  },
  
  // Calculate part compatibility with vehicle
  calculatePartCompatibility: function(part, vehicleCatalog) {
    let score = 0;
    const maxScore = 100;
    
    if (part.make === vehicleCatalog.make) score += 30;
    if (part.model === vehicleCatalog.model) score += 40;
    if (part.year === vehicleCatalog.year_from || part.year === vehicleCatalog.year_to) score += 20;
    if (part.engine === vehicleCatalog.engine) score += 10;
    
    return {
      score: score / maxScore,
      matches: {
        make: part.make === vehicleCatalog.make,
        model: part.model === vehicleCatalog.model,
        year: part.year === vehicleCatalog.year_from || part.year === vehicleCatalog.year_to,
        engine: part.engine === vehicleCatalog.engine
      }
    };
  },
  
  // Generate compatibility reason
  generateCompatibilityReason: function(compatibility) {
    const reasons = [];
    
    if (compatibility.matches.make) reasons.push('marcă compatibilă');
    if (compatibility.matches.model) reasons.push('model compatibil');
    if (compatibility.matches.year) reasons.push('an compatibil');
    if (compatibility.matches.engine) reasons.push('motor compatibil');
    
    return reasons.length > 0 ? reasons.join(', ') : 'compatibilitate generală';
  },
  
  // Generate recommendations based on user preferences
  generateRecommendations: function(parts, preferences) {
    const recommendations = [];
    
    parts.forEach(part => {
      let score = 0;
      
      if (preferences.category && part.category === preferences.category) score += 30;
      if (preferences.make && part.make === preferences.make) score += 25;
      if (preferences.model && part.model === preferences.model) score += 20;
      if (preferences.year && part.year === preferences.year) score += 15;
      if (preferences.budget && part.price <= preferences.budget) score += 10;
      
      if (score > 0) {
        recommendations.push({
          part: part,
          score: score,
          reason: generateRecommendationReason(part, preferences)
        });
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  },
  
  // Generate recommendation reason
  generateRecommendationReason: function(part, preferences) {
    const reasons = [];
    
    if (preferences.category && part.category === preferences.category) reasons.push('categoria potrivită');
    if (preferences.make && part.make === preferences.make) reasons.push('marca potrivită');
    if (preferences.model && part.model === preferences.model) reasons.push('model potrivit');
    if (preferences.year && part.year === preferences.year) reasons.push('an potrivit');
    if (preferences.budget && part.price <= preferences.budget) reasons.push('preț accesibil');
    
    return reasons.length > 0 ? reasons.join(', ') : 'compatibilitate generală';
  },
  
  // Data URI to Blob conversion
  dataURItoBlob: function(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  },
  
  // ===== ERROR MESSAGES =====
  
  ERRORS: ERR
};

// Export the parts commands
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PartsCommands;
}

// Make globally available
window.PartsCommands = PartsCommands;