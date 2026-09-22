begin;

delete from public.profiles
where lower(username) in (
  lower('ئاکۆ'),
  lower('شیلان'),
  lower('هێمن'),
  lower('ڕۆژان'),
  lower('کارزان'),
  lower('دەریا'),
  lower('ئارام'),
  lower('نەرمین'),
  lower('زانا'),
  lower('سۆران'),
  lower('ئەڤین'),
  lower('بەختیار'),
  lower('نیشتمان'),
  lower('هەڵاڵە')
);

commit;