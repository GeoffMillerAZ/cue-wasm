# Open questions

- What compressed transfer/startup/memory limits are justified by the first real
  authoring consumer? Freeze a workload before claiming optimization success.
- Which CUE version should a release share with app-kit? Current source is 0.15.4;
  app-kit uses 0.16.1. Upgrade only with corpus and migration evidence.
- Can direct main-thread loading safely support multiple instances? Current Go
  global/shim ownership needs review; isolated workers are the primary browser path.
- Which supported browser/Node versions pass the complete rebuilt package corpus?
  Historical version labels are not current matrix evidence.
