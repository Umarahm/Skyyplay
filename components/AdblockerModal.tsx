import React, { useEffect, useRef, useState } from "react";

interface AdblockerModalProps {
    iframeSrc: string;
    className?: string;
}

// ============================================================================
// USER CONFIGURATION - ADD YOUR MALICIOUS AD URLs HERE
// ============================================================================
const USER_BLOCKED_URLS: string[] = [
    "*://*.analytics.163.com/*",
    "*://*.mt.analytics.163.com/*",
    "*://*.crash.163.com/*",
    "*://*.crashlytics.163.com/*",
    "*://*.iad.g.163.com/*",
    "*://*.ads.1mobile.com/*",
    "*://*.api.1mobile.com/*",
    "*://*.mp.mobi/*",
    "*://*.phads.com/*",
    "*://*.x1rank.com/*",
    "*://*.ads.1xl.co.uk/*",
    "*://*.s.206ads.com/*",
    "*://*.api.247-inc.net/*",
    "*://*.tie.247-inc.net/*",
    "*://*.47realmedia.com/*",
    "*://*.4s.ru/*",
    "*://*.premium.2ch.net/*",
    "*://*.plugin.2easydroid.com/*",
    "*://*.mdnsys.com/*",
    "*://*.ads.2mdnsys.com/*",
    "*://*.cfa.2mdnsys.com/*",
    "*://*.static.2mdnsys.com/*",
    "*://*.stats.2mdnsys.com/*",
    "*://*.360in.com/*",
    "*://*.ad.360in.com/*",
    "*://*.challenge.360in.com/*",
    "*://*.dispatcher.360in.com/*",
    "*://*.exp.360in.com/*",
    "*://*.hotpot.360in.com/*",
    "*://*.i.360in.com/*",
    "*://*.member.360in.com/*",
    "*://*.3cinteractive.com/*",
    "*://*.3gl.net/*",
    "*://*.g.3gl.net/*",
    "*://*.r.3gl.net/*",
    "*://*.amp.3lift.com/*",
    "*://*.as-dmpsync.3lift.com/*",
    "*://*.as-eb2.3lift.com/*",
    "*://*.as-tlx.3lift.com/*",
    "*://*.cdn.3lift.com/*",
    "*://*.dmpsync.3lift.com/*",
    "*://*.dynamic.3lift.com/*",
    "*://*.eb2.3lift.com/*",
    "*://*.eu-dmpsync.3lift.com/*",
    "*://*.eu-eb2.3lift.com/*",
    "*://*.eu-tlx.3lift.com/*",
    "*://*.ib.3lift.com/*",
    "*://*.images.3lift.com/*",
    "*://*.img.3lift.com/*",
    "*://*.na-dmpsync.3lift.com/*",
    "*://*.na-eb2.3lift.com/*",
    "*://*.na-tlx.3lift.com/*",
    "*://*.pinterest.3lift.com/*",
    "*://*.screenshot.3lift.com/*",
    "*://*.staging-ib.3lift.com/*",
    "*://*.staging-tlx.3lift.com/*",
    "*://*.staging-us-east-tlx.3lift.com/*",
    "*://*.update.3lift.com/*",
    "*://*.post.update.3lift.com/*",
    "*://*.s.update.3lift.com/*",
    "*://*.t.update.3lift.com/*",
    "*://*.us-east-tlx.3lift.com/*",
    "*://*.us-west-tlx.3lift.com/*",
    "*://*.4dle.info/*",
    "*://*.4dsply.com/*",
    "*://*.4mads.com/*",
    "*://*.4seeresults.com/*",
    "*://*.controller.4seeresults.com/*",
    "*://*.device.4seeresults.com/*",
    "*://*.replaycontroller.4seeresults.com/*",
    "*://*.www.5rocks.io/*",
    "*://*.logs.81plug.com/*",
    "*://*.cdn.88-f.net/*",
    "*://*.config.88-f.net/*",
    "*://*.8live.com/*",
    "*://*.ad.8live.com/*",
    "*://*.ads.8live.com/*",
    "*://*.m.8live.com/*",
    "*://*.smart.8live.com/*",
    "*://*.static.8live.com/*",
    "*://*.static2.8live.com/*",
    "*://*.rlog.9gag.com/*",
    "*://*.ad.a-ads.com/*",
    "*://*.click.a-ads.com/*",
    "*://*.static.a-ads.com/*",
    "*://*.fl.a.ki/*",
    "*://*.a2dfp.net/*",
    "*://*.a2pub.com/*",
    "*://*.notify.bugsnag.appstore.a2z.com/*",
    "*://*.segment.a3cloud.net/*",
    "*://*.apptrk.a4.tl/*",
    "*://*.els.a4.tl/*",
    "*://*.jrs.a4.tl/*",
    "*://*.preroll.a4.tl/*",
    "*://*.sdk.a4.tl/*",
    "*://*.a8.net/*",
    "*://*.a9.com/*",
    "*://*.smetrics.aa.com/*",
    "*://*.ads.midatlantic.aaa.com/*",
    "*://*.smetrics.midatlantic.aaa.com/*",
    "*://*.aarki.com/*",
    "*://*.rm.aarki.net/*",
    "*://*.android-sdk.aatkit.com/*",
    "*://*.backup.aatkit.com/*",
    "*://*.dbmaster.aatkit.com/*",
    "*://*.reporting.aatkit.com/*",
    "*://*.admintool.revenuetool.aatkit.com/*",
    "*://*.rules.aatkit.com/*",
    "*://*.rules2.aatkit.com/*",
    "*://*.rules3.aatkit.com/*",
    "*://*.stat-parser02.aatkit.com/*",
    "*://*.master.statistics.aatkit.com/*",
    "*://*.queue.statistics.aatkit.com/*",
    "*://*.statisticsmaster.aatkit.com/*",
    "*://*.tracking.aatkit.com/*",
    "*://*.zookeeper01.aatkit.com/*",
    "*://*.assets.abbi.io/*",
    "*://*.rtapi.abbi.io/*",
    "*://*.stats.abbi.io/*",
    "*://*.abnad.net/*",
    "*://*.ak-probe.abtasty.com/*",
    "*://*.ariane.abtasty.com/*",
    "*://*.datacollect7.abtasty.com/*",
    "*://*.datacollect9.abtasty.com/*",
    "*://*.dcinfos-cache.abtasty.com/*",
    "*://*.nirror.abtasty.com/*",
    "*://*.api.nirror.abtasty.com/*",
    "*://*.static.nirror.abtasty.com/*",
    "*://*.api.accengage.com/*",
    "*://*.cdn.accengage.com/*",
    "*://*.dev.accengage.com/*",
    "*://*.push1.dev.accengage.com/*",
    "*://*.mobilecrm.accengage.com/*",
    "*://*.pingapi.accengage.com/*",
    "*://*.preprod.accengage.com/*",
    "*://*.stats.accengage.com/*",
    "*://*.api.accengage.net/*",
    "*://*.accesstrade.com/*",
    "*://*.accesstrade.com.vn/*",
    "*://*.fast.accesstrade.com.vn/*",
    "*://*.accesstrade.vn/*",
    "*://*.campaign.accesstrade.vn/*",
    "*://*.click.accesstrade.vn/*",
    "*://*.cv.accesstrade.vn/*",
    "*://*.imp.accesstrade.vn/*",
    "*://*.static.accesstrade.vn/*",
    "*://*.acento.com/*",
    "*://*.ackak.com/*",
    "*://*.tags.acmeaom.com/*",
    "*://*.acsseo.com/*",
    "*://*.actionads.ru/*",
    "*://*.actionpay.ru/*",
    "*://*.actionteaser.ru/*",
    "*://*.mam.ad-balancer.at/*",
    "*://*.streaming.ad-balancer.at/*",
    "*://*.api.ad-brix.com/*",
    "*://*.as.ad-brix.com/*",
    "*://*.campaign.ad-brix.com/*",
    "*://*.config.ad-brix.com/*",
    "*://*.cvr.ad-brix.com/*",
    "*://*.partners.ad-brix.com/*",
    "*://*.ref.ad-brix.com/*",
    "*://*.tracking.ad-brix.com/*",
    "*://*.trd-trk.ad-brix.com/*",
    "*://*.ads.ad-center.com/*",
    "*://*.ad-cloud.jp/*",
    "*://*.ad-delivery.net/*",
    "*://*.api.ad-locus.com/*",
    "*://*.a.api.ad-locus.com/*",
    "*://*.ad-maven.com/*",
    "*://*.static.ad-maven.com/*",
    "*://*.ad-move.jp/*",
    "*://*.imp.ad-plus.cn/*",
    "*://*.data.ad-score.com/*",
    "*://*.data2.ad-score.com/*",
    "*://*.js2.ad-score.com/*",
    "*://*.rdr.ad-score.com/*",
    "*://*.rdrs.ad-score.com/*",
    "*://*.c.ad-srv.co/*",
    "*://*.ad-stir.com/*",
    "*://*.bypass.ad-stir.com/*",
    "*://*.js.ad-stir.com/*",
    "*://*.sync.ad-stir.com/*",
    "*://*.tr.ad-stir.com/*",
    "*://*.win.ad-stir.com/*",
    "*://*.ad-sys.com/*",
    "*://*.a.ad.gt/*",
    "*://*.p.ad.gt/*",
    "*://*.seg.ad.gt/*",
    "*://*.ad.org.vn/*",
    "*://*.serving.ad.org.vn/*",
    "*://*.static.ad.org.vn/*",
    "*://*.ad1.ru/*",
    "*://*.ad120m.com/*",
    "*://*.ad127m.com/*",
    "*://*.ad131m.com/*",
    "*://*.ad132m.com/*",
    "*://*.go.ad1data.com/*",
    "*://*.ad2games.com/*",
    "*://*.adlogs.ad2iction.com/*",
    "*://*.ads.ad2iction.com/*",
    "*://*.provider.ad360.vn/*",
    "*://*.tracking.ad360.vn/*",
    "*://*.xcache.ad360.vn/*",
    "*://*.ad4.com.cn/*",
    "*://*.mp.ad4.com.cn/*",
    "*://*.r.ad4.com.cn/*",
    "*://*.s.ad4.com.cn/*",
    "*://*.ads.ad4game.com/*",
    "*://*.ad4push.com/*",
    "*://*.api.ad4push.com/*",
    "*://*.ad6media.fr/*",
    "*://*.ads.adacado.com/*",
    "*://*.cdn.adacado.com/*",
    "*://*.info.adacado.com/*",
    "*://*.static.adacado.com/*",
    "*://*.ads.adadapted.com/*",
    "*://*.aqt.adalliance.io/*",
    "*://*.box.adalliance.io/*",
    "*://*.datahub.adalliance.io/*",
    "*://*.dmpstorage.adalliance.io/*",
    "*://*.hello.adalliance.io/*",
    "*://*.mafo.adalliance.io/*",
    "*://*.tracking.adalliance.io/*",
    "*://*.tracking.adalyser.com/*",
    "*://*.ads.adand.co.kr/*",
    "*://*.ads.adap.tv/*",
    "*://*.log.adap.tv/*",
    "*://*.segments.adap.tv/*",
    "*://*.app.adapt.io/*",
    "*://*.adasiaholdings.com/*",
    "*://*.adnetwork.adasiaholdings.com/*",
    "*://*.twinpine.adatrix.com/*",
    "*://*.adx1.twinpine.adatrix.com/*",
    "*://*.static.twinpine.adatrix.com/*",
    "*://*.adbanner.ro/*",
    "*://*.api.adbecrsl.com/*",
    "*://*.adblade.com/*",
    "*://*.staticd.cdn.adblade.com/*",
    "*://*.dmp.adblade.com/*",
    "*://*.pixel.adblade.com/*",
    "*://*.static-cdn.adblade.com/*",
    "*://*.access.adblox.net/*",
    "*://*.services.adblox.net/*",
    "*://*.servs.adblox.net/*",
    "*://*.adbn.ru/*",
    "*://*.mobiledl.adboe.com/*",
    "*://*.adbomb.ru/*",
    "*://*.adboost.net/*",
    "*://*.adbooth.com/*",
    "*://*.adbro.me/*",
    "*://*.api.adbro.me/*",
    "*://*.apis.adbro.me/*",
    "*://*.cdn.adbro.me/*",
    "*://*.adbuddiz.com/*",
    "*://*.sdk.adbuddiz.com/*",
    "*://*.adbutler.de/*",
    "*://*.api.adcalls.nl/*",
    "*://*.adcamp.ru/*",
    "*://*.adcast.ru/*",
    "*://*.cdn1.adcdnx.com/*",
    "*://*.rtb.adcel.co/*",
    "*://*.t.adcell.com/*",
    "*://*.serve.adcenter.io/*",
    "*://*.click.serve.adcenter.io/*",
    "*://*.filter.serve.adcenter.io/*",
    "*://*.adchina.com/*",
    "*://*.adchoice.com/*",
    "*://*.adcito.com/*",
    "*://*.track.adclear.net/*",
    "*://*.adclix.org/*",
    "*://*.adcloud.jp/*",
    "*://*.adcloud.net/*",
    "*://*.tt.adcocktail.com/*",
    "*://*.adc3-assets.adcolony.com/*",
    "*://*.adc3-launch.adcolony.com/*",
    "*://*.ads20.adcolony.com/*",
    "*://*.ads30.adcolony.com/*",
    "*://*.alpha-assets.adcolony.com/*",
    "*://*.androidads20.adcolony.com/*",
    "*://*.androidads20staging.adcolony.com/*",
    "*://*.androidads21.adcolony.com/*",
    "*://*.androidads23.adcolony.com/*",
    "*://*.androidads30.adcolony.com/*",
    "*://*.c4d-cdn.adcolony.com/*",
    "*://*.c4dm.adcolony.com/*",
    "*://*.clients.adcolony.com/*",
    "*://*.clients-alpha.adcolony.com/*",
    "*://*.clients-api.adcolony.com/*",
    "*://*.clients-redux.adcolony.com/*",
    "*://*.clients-staging.adcolony.com/*",
    "*://*.composer.adcolony.com/*",
    "*://*.cpa.adcolony.com/*",
    "*://*.cpa-paas.adcolony.com/*",
    "*://*.de.adcolony.com/*",
    "*://*.director.adcolony.com/*",
    "*://*.events3.adcolony.com/*",
    "*://*.events3alt.adcolony.com/*",
    "*://*.iosads20.adcolony.com/*",
    "*://*.iosads22.adcolony.com/*",
    "*://*.iosads24.adcolony.com/*",
    "*://*.pie.adcolony.com/*",
    "*://*.rma.adcolony.com/*",
    "*://*.rtb.adcolony.com/*",
    "*://*.securev4vcapi.adcolony.com/*",
    "*://*.wd.adcolony.com/*",
    "*://*.adcome.cn/*",
    "*://*.api.adcome.ru/*",
    "*://*.adcomplete.ru/*",
    "*://*.dynamic.adcrowd.com/*",
    "*://*.adcv.jp/*",
    "*://*.viikwbsh.com/*",
    "*://*.viikwbsh.com/*",
    "*://*.g2288.com/*",
    "*://*.addapptr.com/*",
    "*://*.tracking.addapptr.com/*",
    "*://*.addash.co/*",
    "*://*.addealing.com/*",
    "*://*.adapi.addealsnetwork.com/*",
    "*://*.ads.addealsnetwork.com/*",
    "*://*.adsinter1.addealsnetwork.com/*",
    "*://*.adsvideo1.addealsnetwork.com/*",
    "*://*.trk-int.addealsnetwork.com/*",
    "*://*.track.addict-mobile.net/*",
    "*://*.api.addnow.com/*",
    "*://*.api.addthis.com/*",
    "*://*.s7.addthis.com/*",
    "*://*.stats.addtoany.com/*",
    "*://*.img.adecorp.co.kr/*",
    "*://*.ads.adecosystems.net/*",
    "*://*.ads.adecosystems.tech/*",
    "*://*.sdk01.adecosystems.tech/*",
    "*://*.sdk02.adecosystems.tech/*",
    "*://*.ads.adelement.com/*",
    "*://*.adelva.com/*",
    "*://*.bm.adentifi.com/*",
    "*://*.rtb.adentifi.com/*",
    "*://*.b.adexchangemachine.com/*",
    "*://*.c.adexchangemachine.com/*",
    "*://*.filter.adexchangemedia.xyz/*",
    "*://*.rtb-useast.adexchangemedia.xyz/*",
    "*://*.xml.adexchangemedia.xyz/*",
    "*://*.adexprt.com/*",
    "*://*.adextent.com/*",
    "*://*.adfactor.nl/*",
    "*://*.adfalcon.com/*",
    "*://*.api.adfalcon.com/*",
    "*://*.app01.adfalcon.com/*",
    "*://*.app02.adfalcon.com/*",
    "*://*.cdn01.static.adfalcon.com/*",
    "*://*.adflake.com/*",
    "*://*.adflow.ru/*",
    "*://*.adfog.ru/*",
    "*://*.adfonic.net/*",
    "*://*.as.adfonic.net/*",
    "*://*.adforgames.com/*",
    "*://*.js.adforgames.com/*",
    "*://*.adform.com/*",
    "*://*.api.adform.com/*",
    "*://*.hawebs.adform.com/*",
    "*://*.preview.adform.com/*",
    "*://*.adform.net/*",
    "*://*.adx.adform.net/*",
    "*://*.c1.adform.net/*",
    "*://*.files.adform.net/*",
    "*://*.track.adform.net/*",
    "*://*.adformdsp.net/*",
    "*://*.ads.adfox.me/*",
    "*://*.banners.adfox.me/*",
    "*://*.banners.adfox.net/*",
    "*://*.adfox.ru/*",
    "*://*.ads.adfox.ru/*",
    "*://*.banners.adfox.ru/*",
    "*://*.adfox.vn/*",
    "*://*.adfurikun.jp/*",
    "*://*.api.adfurikun.jp/*",
    "*://*.ginf.adfurikun.jp/*",
    "*://*.adfuture.cn/*",
    "*://*.folder.adfuture.cn/*",
    "*://*.fota4.adfuture.cn/*",
    "*://*.fotacontrol.adfuture.cn/*",
    "*://*.rebootv5.adfuture.cn/*",
    "*://*.clk.adgaterewards.com/*",
    "*://*.wall.adgaterewards.com/*",
    "*://*.adgear.com/*",
    "*://*.a.adgear.com/*",
    "*://*.lga-delivery-7.sys.adgear.com/*",
    "*://*.lga-delivery-8.sys.adgear.com/*",
    "*://*.lga-delivery-9.sys.adgear.com/*",
    "*://*.sjc-delivery-7.sys.adgear.com/*",
    "*://*.sjc-delivery-8.sys.adgear.com/*",
    "*://*.sjc-delivery-9.sys.adgear.com/*",
    "*://*.berry-1001.adgoji.com/*",
    "*://*.tracking.adgoji.com/*",
    "*://*.adgridwork.com/*",
    "*://*.adgroups.net/*",
    "*://*.adgrx.com/*",
    "*://*.adhands.ru/*",
    "*://*.adpickup-east.adhaven.com/*",
    "*://*.e.adhaven.com/*",
    "*://*.e-prod.adhaven.com/*",
    "*://*.ads-ipm.adhese.com/*",
    "*://*.ads-mannenmedia.adhese.com/*",
    "*://*.ads-mediafin.adhese.com/*",
    "*://*.ads-orange.adhese.com/*",
    "*://*.ads-rmb.adhese.com/*",
    "*://*.ads-roularta.adhese.com/*",
    "*://*.pool-ipm.adhese.com/*",
    "*://*.pool-mediafin.adhese.com/*",
    "*://*.pool-pebblemedia.adhese.com/*",
    "*://*.user-sync-orange.adhese.com/*",
    "*://*.ivid-cdn.adhigh.net/*",
    "*://*.ivid-f5-us-va.adhigh.net/*",
    "*://*.px.adhigh.net/*",
    "*://*.adhitzads.com/*",
    "*://*.p3.adhitzads.com/*",
    "*://*.adhood.com/*",
    "*://*.adhub.ru/*",
    "*://*.aksdk-images.adikteev.com/*",
    "*://*.adimg.net/*",
    "*://*.adinch.com/*",
    "*://*.consent.adincube.com/*",
    "*://*.sdk.adincube.com/*",
    "*://*.tag.adincube.com/*",
    "*://*.adinfuse.com/*",
    "*://*.adingo.jp/*",
    "*://*.hv.adingo.jp/*",
    "*://*.sh.adingo.jp/*",
    "*://*.adinte.jp/*",
    "*://*.ad.adip.ly/*",
    "*://*.aa.adfarm1.adition.com/*",
    "*://*.ad11p.adfarm1.adition.com/*",
    "*://*.ad13.adfarm1.adition.com/*",
    "*://*.adsdk.adfarm1.adition.com/*",
    "*://*.dspcluster.adfarm1.adition.com/*",
    "*://*.mobile.adfarm1.adition.com/*",
    "*://*.static.adfarm1.adition.com/*",
    "*://*.cd.adition.com/*",
    "*://*.dbt.adition.com/*",
    "*://*.imagesrv.adition.com/*",
    "*://*.track.adition.com/*",
    "*://*.vt.adition.com/*",
    "*://*.adizer.ru/*",
    "*://*.pool.adizio.com/*",
    "*://*.adj.st/*",
    "*://*.adjuggler.net/*",
    "*://*.adjust.com/*",
    "*://*.app.adjust.com/*",
    "*://*.atom.adjust.com/*",
    "*://*.events.adjust.com/*",
    "*://*.s2s.adjust.com/*",
    "*://*.view.adjust.com/*",
    "*://*.adjust.io/*",
    "*://*.app.adjust.io/*",
    "*://*.archive.adjust.io/*",
    "*://*.backend.adjust.io/*",
    "*://*.db.adjust.io/*",
    "*://*.frontend.adjust.io/*",
    "*://*.redis.adjust.io/*",
    "*://*.rsa.adjust.io/*",
    "*://*.stage.adjust.io/*",
    "*://*.adjustnetwork.com/*",
    "*://*.dsp-eu.adkernel.com/*",
    "*://*.dsp-uswest.adkernel.com/*",
    "*://*.openrtb.adkernel.com/*",
    "*://*.static-rtb.adkernel.com/*",
    "*://*.svc-analytics.adkernel.com/*",
    "*://*.sync.adkernel.com/*",
    "*://*.tag.adkernel.com/*",
    "*://*.bp.adkmob.com/*",
    "*://*.cm.adkmob.com/*",
    "*://*.profile.adkmob.com/*",
    "*://*.rtb.adkmob.com/*",
    "*://*.ssdk.adkmob.com/*",
    "*://*.unad.adkmob.com/*",
    "*://*.unrcv.adkmob.com/*",
    "*://*.adtrack.adleadevent.com/*",
    "*://*.notify.adleadevent.com/*",
    "*://*.bs.adledge.com/*",
    "*://*.dsp.adledge.com/*",
    "*://*.epn.adledge.com/*",
    "*://*.lbjs.adledge.com/*",
    "*://*.rs.adledge.com/*",
    "*://*.rs2.adledge.com/*",
    "*://*.ser.adledge.com/*",
    "*://*.skw.adledge.com/*",
    "*://*.vpx.adledge.com/*",
    "*://*.gwk.adlibr.com/*",
    "*://*.gwx.adlibr.com/*",
    "*://*.trk.adlibr.com/*",
    "*://*.cdn.adligature.com/*",
    "*://*.arkadium-tagan.adlightning.com/*",
    "*://*.bhmedia-tagan.adlightning.com/*",
    "*://*.buzzfeed-tagan.adlightning.com/*",
    "*://*.carambola-tagan.adlightning.com/*",
    "*://*.enthusiastgaming-tagan.adlightning.com/*",
    "*://*.inspiredtaste-tagan.adlightning.com/*",
    "*://*.leeenterprises-tagan.adlightning.com/*",
    "*://*.legacy-tagan.adlightning.com/*",
    "*://*.livingly-tagan.adlightning.com/*",
    "*://*.math-aids-signup-tagan.adlightning.com/*",
    "*://*.math-aids-tagan.adlightning.com/*",
    "*://*.math-aids-teamsnap-tagan.adlightning.com/*",
    "*://*.math-aids-ten-tagan.adlightning.com/*",
    "*://*.metv-tagan.adlightning.com/*",
    "*://*.nationalreview-tagan.adlightning.com/*",
    "*://*.patch-tagan.adlightning.com/*",
    "*://*.penske-tagan.adlightning.com/*",
    "*://*.realtor-tagan.adlightning.com/*",
    "*://*.rubicon-tagan.adlightning.com/*",
    "*://*.sheknows-tagan.adlightning.com/*",
    "*://*.sinclair-tagan.adlightning.com/*",
    "*://*.slate-tagan.adlightning.com/*",
    "*://*.tagan.adlightning.com/*",
    "*://*.tegna-tagan.adlightning.com/*",
    "*://*.thisoldhouse-tagan.adlightning.com/*",
    "*://*.zam-tagan.adlightning.com/*",
    "*://*.rtb.adlogix.io/*",
    "*://*.am.adlooxtracking.com/*",
    "*://*.am01.adlooxtracking.com/*",
    "*://*.am02.adlooxtracking.com/*",
    "*://*.am03.adlooxtracking.com/*",
    "*://*.am04.adlooxtracking.com/*",
    "*://*.am05.adlooxtracking.com/*",
    "*://*.am06.adlooxtracking.com/*",
    "*://*.as.adlooxtracking.com/*",
    "*://*.brandsafe.adlooxtracking.com/*",
    "*://*.data01.adlooxtracking.com/*",
    "*://*.data02.adlooxtracking.com/*",
    "*://*.data03.adlooxtracking.com/*",
    "*://*.data04.adlooxtracking.com/*",
    "*://*.data05.adlooxtracking.com/*",
    "*://*.data06.adlooxtracking.com/*",
    "*://*.data07.adlooxtracking.com/*",
    "*://*.data08.adlooxtracking.com/*",
    "*://*.data09.adlooxtracking.com/*",
    "*://*.data10.adlooxtracking.com/*",
    "*://*.data11.adlooxtracking.com/*",
    "*://*.data12.adlooxtracking.com/*",
    "*://*.data13.adlooxtracking.com/*",
    "*://*.data134.adlooxtracking.com/*",
    "*://*.data14.adlooxtracking.com/*",
    "*://*.data15.adlooxtracking.com/*",
    "*://*.data16.adlooxtracking.com/*",
    "*://*.data17.adlooxtracking.com/*",
    "*://*.data18.adlooxtracking.com/*",
    "*://*.data19.adlooxtracking.com/*",
    "*://*.data20.adlooxtracking.com/*",
    "*://*.data21.adlooxtracking.com/*",
    "*://*.data22.adlooxtracking.com/*",
    "*://*.data23.adlooxtracking.com/*",
    "*://*.data24.adlooxtracking.com/*",
    "*://*.data25.adlooxtracking.com/*",
    "*://*.data26.adlooxtracking.com/*",
    "*://*.data27.adlooxtracking.com/*",
    "*://*.data28.adlooxtracking.com/*",
    "*://*.data29.adlooxtracking.com/*",
    "*://*.data30.adlooxtracking.com/*",
    "*://*.data31.adlooxtracking.com/*",
    "*://*.data33.adlooxtracking.com/*",
    "*://*.data34.adlooxtracking.com/*",
    "*://*.data35.adlooxtracking.com/*",
    "*://*.data36.adlooxtracking.com/*",
    "*://*.data37.adlooxtracking.com/*",
    "*://*.data38.adlooxtracking.com/*",
    "*://*.data39.adlooxtracking.com/*",
    "*://*.data53.adlooxtracking.com/*",
    "*://*.data55.adlooxtracking.com/*",
    "*://*.data56.adlooxtracking.com/*",
    "*://*.data57.adlooxtracking.com/*",
    "*://*.data58.adlooxtracking.com/*",
    "*://*.data60.adlooxtracking.com/*",
    "*://*.data61.adlooxtracking.com/*",
    "*://*.data62.adlooxtracking.com/*",
    "*://*.data63.adlooxtracking.com/*",
    "*://*.data64.adlooxtracking.com/*",
    "*://*.data65.adlooxtracking.com/*",
    "*://*.data66.adlooxtracking.com/*",
    "*://*.data67.adlooxtracking.com/*",
    "*://*.data68.adlooxtracking.com/*",
    "*://*.data81.adlooxtracking.com/*",
    "*://*.datam01.adlooxtracking.com/*",
    "*://*.datam02.adlooxtracking.com/*",
    "*://*.datam03.adlooxtracking.com/*",
    "*://*.datam04.adlooxtracking.com/*",
    "*://*.datam05.adlooxtracking.com/*",
    "*://*.datam11.adlooxtracking.com/*",
    "*://*.datam12.adlooxtracking.com/*",
    "*://*.datam13.adlooxtracking.com/*",
    "*://*.datam14.adlooxtracking.com/*",
    "*://*.datam15.adlooxtracking.com/*",
    "*://*.datam16.adlooxtracking.com/*",
    "*://*.datam17.adlooxtracking.com/*",
    "*://*.datam18.adlooxtracking.com/*",
    "*://*.datam19.adlooxtracking.com/*",
    "*://*.datam20.adlooxtracking.com/*",
    "*://*.datam21.adlooxtracking.com/*",
    "*://*.datam22.adlooxtracking.com/*",
    "*://*.datam23.adlooxtracking.com/*",
    "*://*.datam24.adlooxtracking.com/*",
    "*://*.datam25.adlooxtracking.com/*",
    "*://*.datam26.adlooxtracking.com/*",
    "*://*.datas01.adlooxtracking.com/*",
    "*://*.datas02.adlooxtracking.com/*",
];

// ============================================================================
// AUTOMATIC BLOCKING PATTERNS (uBlock-inspired)
// ============================================================================
const AUTO_BLOCK_PATTERNS = [
    // Ad networks
    /doubleclick\.net/i,
    /googlesyndication\.com/i,
    /googleadservices\.com/i,
    /popads\.net/i,
    /popunder\.com/i,
    /taboola\.com/i,
    /outbrain\.com/i,
    // Common ad patterns
    /banner/i,
    /advert/i,
    /sponsor/i,
    /promo/i,
    /affiliate/i,
    /tracker/i,
    /analytics/i,
];

// ============================================================================
// VM SCRIPT AND OBFUSCATION BLOCKING PATTERNS
// ============================================================================
const VM_BLOCK_PATTERNS = [
    // VM script patterns
    /VM\d+/i,
    /avejwa\?d=\d+/i,
    /await in [A-Z0-9]+/i,
    /\(anonymous\) \(VM\d+:\d+\)/i,
    // Obfuscated patterns
    /[a-zA-Z0-9]{2,4}\s*\([a-zA-Z0-9?=&]+\)/i,
    /[A-Z0-9]{2,4}\s*\([A-Z0-9?=&]+\)/i,
    // Suspicious URL patterns
    /\?d=\d+/i,
    /[a-zA-Z]{5,}\?[a-zA-Z]=[0-9]/i,
];

export const AdblockerModal: React.FC<AdblockerModalProps> = ({ iframeSrc, className }) => {
    const [showModal, setShowModal] = useState(false);
    const [blockedClicks, setBlockedClicks] = useState(0);
    const [blockedRedirects, setBlockedRedirects] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const originalSrcRef = useRef(iframeSrc);

    useEffect(() => {
        // Only show modal once per session
        if (localStorage.getItem("adblockerModalShown")) return;
        setShowModal(true);
        localStorage.setItem("adblockerModalShown", "true");
    }, []);

    // ============================================================================
    // USER-CONFIGURED MALICIOUS AD BLOCKING
    // ============================================================================
    useEffect(() => {
        // Function to check if URL is in user's blocked list
        const isUserBlockedUrl = (url: string): boolean => {
            return USER_BLOCKED_URLS.some(blockedUrl => url.includes(blockedUrl));
        };

        // Block link clicks to malicious ads
        const handleLinkClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const link = target.closest('a');

            if (link) {
                const href = link.href;
                if (href && isUserBlockedUrl(href)) {
                    event.preventDefault();
                    event.stopPropagation();
                    setBlockedClicks(prev => prev + 1);

                    // Show warning notification
                    showBlockedNotification('🚫 Malicious ad link blocked!');
                    return false;
                }
            }
        };

        // Block iframe redirects to malicious ads
        const handleIframeLoad = () => {
            try {
                const iframe = iframeRef.current;
                if (iframe && iframe.src) {
                    if (isUserBlockedUrl(iframe.src)) {
                        iframe.src = originalSrcRef.current;
                        setBlockedRedirects(prev => prev + 1);
                        showBlockedNotification('🚫 Malicious iframe redirect blocked!');
                    }
                }
            } catch (err) {
                // Cross-origin restriction
            }
        };

        // Block window.open to malicious ads
        const originalOpen = window.open;
        window.open = function (url?: string | URL, target?: string, features?: string) {
            const urlString = typeof url === 'string' ? url : url?.toString() || '';
            if (urlString && isUserBlockedUrl(urlString)) {
                setBlockedClicks(prev => prev + 1);
                showBlockedNotification('🚫 Malicious popup blocked!');
                return null; // Block the popup
            }
            return originalOpen.call(this, url, target, features);
        };

        // Block history navigation to malicious ads
        const originalPushState = history.pushState;
        history.pushState = function (data: any, title: string, url?: string | URL) {
            const urlString = typeof url === 'string' ? url : url?.toString() || '';
            if (urlString && isUserBlockedUrl(urlString)) {
                setBlockedRedirects(prev => prev + 1);
                showBlockedNotification('🚫 Malicious navigation blocked!');
                return; // Block the navigation
            }
            return originalPushState.call(this, data, title, url);
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function (data: any, title: string, url?: string | URL) {
            const urlString = typeof url === 'string' ? url : url?.toString() || '';
            if (urlString && isUserBlockedUrl(urlString)) {
                setBlockedRedirects(prev => prev + 1);
                showBlockedNotification('🚫 Malicious navigation blocked!');
                return; // Block the navigation
            }
            return originalReplaceState.call(this, data, title, url);
        };

        // Block fetch requests to malicious ads
        const originalFetch = window.fetch;
        window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
            const url = typeof input === 'string' ? input : input.toString();

            if (isUserBlockedUrl(url)) {
                setBlockedClicks(prev => prev + 1);
                return Promise.resolve(new Response('', { status: 403 }));
            }

            return originalFetch.call(this, input, init);
        };

        // Block XMLHttpRequest to malicious ads
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method: string, url: string, async?: boolean, user?: string, password?: string) {
            if (isUserBlockedUrl(url)) {
                setBlockedClicks(prev => prev + 1);
                return; // Block the request
            }
            return originalXHROpen.call(this, method, url, async || true, user, password);
        };

        // Add event listeners
        document.addEventListener('click', handleLinkClick, true);
        if (iframeRef.current) {
            iframeRef.current.addEventListener('load', handleIframeLoad);
        }

        // Cleanup function
        return () => {
            document.removeEventListener('click', handleLinkClick, true);
            if (iframeRef.current) {
                iframeRef.current.removeEventListener('load', handleIframeLoad);
            }
            window.open = originalOpen;
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXHROpen;
        };
    }, []);

    // ============================================================================
    // AUTOMATIC AD BLOCKING (uBlock-inspired)
    // ============================================================================
    useEffect(() => {
        // Block automatic ad patterns
        const blockAutoAds = () => {
            // Block fetch requests to ad networks
            const originalFetch = window.fetch;
            window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
                const url = typeof input === 'string' ? input : input.toString();

                if (AUTO_BLOCK_PATTERNS.some(pattern => pattern.test(url))) {
                    return Promise.resolve(new Response('', {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain' }
                    }));
                }

                return originalFetch.call(this, input, init);
            };

            // Block XMLHttpRequest to ad networks
            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function (method: string, url: string, async?: boolean, user?: string, password?: string) {
                if (AUTO_BLOCK_PATTERNS.some(pattern => pattern.test(url))) {
                    return; // Block the request
                }
                return originalXHROpen.call(this, method, url, async || true, user, password);
            };

            // Block script loading from ad networks
            const originalCreateElement = document.createElement;
            document.createElement = function (tagName: string) {
                const element = originalCreateElement.call(this, tagName);

                if (tagName.toLowerCase() === 'script') {
                    Object.defineProperty(element, 'src', {
                        set: function (value: string) {
                            if (value && AUTO_BLOCK_PATTERNS.some(pattern => pattern.test(value))) {
                                return; // Block the script
                            }
                            element.setAttribute('src', value);
                        },
                        get: function () {
                            return element.getAttribute('src') || '';
                        }
                    });
                }

                return element;
            };

            // Cleanup function
            return () => {
                window.fetch = originalFetch;
                XMLHttpRequest.prototype.open = originalXHROpen;
                document.createElement = originalCreateElement;
            };
        };

        const cleanup = blockAutoAds();

        // Cleanup on unmount
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    // ============================================================================
    // VM SCRIPT AND OBFUSCATION BLOCKING
    // ============================================================================
    useEffect(() => {
        // Block VM scripts and obfuscated patterns
        const blockVMScripts = () => {
            // Override eval to block VM scripts
            const originalEval = window.eval;
            window.eval = function (code: string) {
                if (code) {
                    // Block VM script patterns
                    if (VM_BLOCK_PATTERNS.some(pattern => pattern.test(code))) {
                        return undefined; // Block VM scripts
                    }

                    // Remove await loops that cause debugger pauses
                    code = code.replace(/await\s+in\s+[A-Z0-9]+/g, '');
                    code = code.replace(/while\s*\(\s*true\s*\)\s*\{[\s\S]*?await[\s\S]*?\}/g, '');
                    code = code.replace(/for\s*\(\s*;\s*;\s*\)\s*\{[\s\S]*?await[\s\S]*?\}/g, '');

                    // Remove obfuscated function calls
                    code = code.replace(/[A-Z0-9]{2,4}\s*\([A-Z0-9?=&]+\)/g, '');
                }
                return originalEval.call(this, code);
            };

            // Block script creation with VM content
            const originalCreateElement = document.createElement;
            document.createElement = function (tagName: string) {
                const element = originalCreateElement.call(this, tagName);

                if (tagName.toLowerCase() === 'script') {
                    // Override textContent to block VM scripts
                    Object.defineProperty(element, 'textContent', {
                        set: function (value: string) {
                            if (value) {
                                // Block VM script patterns
                                if (VM_BLOCK_PATTERNS.some(pattern => pattern.test(value))) {
                                    return; // Block the script
                                }

                                // Remove await loops
                                value = value.replace(/await\s+in\s+[A-Z0-9]+/g, '');
                                value = value.replace(/while\s*\(\s*true\s*\)\s*\{[\s\S]*?await[\s\S]*?\}/g, '');
                            }
                            element.setAttribute('data-content', value || '');
                        },
                        get: function () {
                            return element.getAttribute('data-content') || '';
                        }
                    });

                    // Override src to block VM script sources
                    Object.defineProperty(element, 'src', {
                        set: function (value: string) {
                            if (value && VM_BLOCK_PATTERNS.some(pattern => pattern.test(value))) {
                                return; // Block VM script sources
                            }
                            element.setAttribute('src', value);
                        },
                        get: function () {
                            return element.getAttribute('src') || '';
                        }
                    });
                }

                return element;
            };

            // Block console output from VM scripts
            const originalConsoleLog = console.log;
            const originalConsoleWarn = console.warn;
            const originalConsoleError = console.error;

            console.log = function (...args: any[]) {
                const message = args.join(' ');
                if (VM_BLOCK_PATTERNS.some(pattern => pattern.test(message))) {
                    return; // Block VM script logs
                }
                return originalConsoleLog.apply(this, args);
            };

            console.warn = function (...args: any[]) {
                const message = args.join(' ');
                if (VM_BLOCK_PATTERNS.some(pattern => pattern.test(message))) {
                    return; // Block VM script warnings
                }
                return originalConsoleWarn.apply(this, args);
            };

            console.error = function (...args: any[]) {
                const message = args.join(' ');
                if (VM_BLOCK_PATTERNS.some(pattern => pattern.test(message))) {
                    return; // Block VM script errors
                }
                return originalConsoleError.apply(this, args);
            };

            // Monitor for VM scripts in DOM
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as Element;

                                // Remove VM scripts
                                if (element.tagName === 'SCRIPT') {
                                    const script = element as HTMLScriptElement;

                                    // Check script content
                                    if (script.textContent && VM_BLOCK_PATTERNS.some(pattern => pattern.test(script.textContent!))) {
                                        script.remove();
                                        return;
                                    }

                                    // Check script src
                                    if (script.src && VM_BLOCK_PATTERNS.some(pattern => pattern.test(script.src))) {
                                        script.remove();
                                        return;
                                    }
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Cleanup function
            return () => {
                window.eval = originalEval;
                document.createElement = originalCreateElement;
                console.log = originalConsoleLog;
                console.warn = originalConsoleWarn;
                console.error = originalConsoleError;
                observer.disconnect();
            };
        };

        const cleanup = blockVMScripts();

        // Cleanup on unmount
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    const showBlockedNotification = (message: string) => {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3000);
    };

    return (
        <div className={className}>
            {/* Protection status */}
            {(blockedClicks > 0 || blockedRedirects > 0) && (
                <div className="absolute top-4 left-4 bg-green-600 text-white p-3 rounded-lg z-50 text-sm">
                    <div className="font-bold">🛡️ Protection Active</div>
                    <div>Clicks blocked: {blockedClicks}</div>
                    <div>Redirects blocked: {blockedRedirects}</div>
                </div>
            )}

            {/* Modal UI */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
                        <h2 className="text-xl font-bold mb-2">Malicious Ad Protection Active</h2>
                        <p className="mb-4">
                            We're blocking malicious ads and redirects based on your URL list.
                            <br />
                            <strong>Add your URLs to USER_BLOCKED_URLS array!</strong>
                        </p>
                        <div className="text-left bg-gray-100 p-3 rounded text-xs mb-4">
                            <strong>Current blocked URLs:</strong>
                            <ul className="mt-1">
                                {USER_BLOCKED_URLS.length > 0 ? (
                                    USER_BLOCKED_URLS.map((url, index) => (
                                        <li key={index} className="text-gray-600">• {url}</li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 italic">No URLs added yet</li>
                                )}
                            </ul>
                        </div>
                        <button
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            onClick={() => setShowModal(false)}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Main video iframe */}
            <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full h-full rounded-lg shadow-2xl"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-orientation-lock"
            />
        </div>
    );
};

export default AdblockerModal; 