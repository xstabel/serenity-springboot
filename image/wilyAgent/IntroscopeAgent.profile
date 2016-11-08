########################################################################
#
# PRODUBAN customization
#
########################################################################
#
# IMPORTANT: This is a customized profile taken from the original
# Agent_Source zip distribution.
#
########################################################################

#################################
# Enterprise Manager Locations and Names
# (names defined in this section are only used in the
# introscope.agent.enterprisemanager.connectionorder property)
#
# ================
introscope.agent.enterprisemanager.connectionorder=DEFAULT
introscope.agent.enterprisemanager.transport.tcp.host.DEFAULT=[WILY_MOM_FQDN]
introscope.agent.enterprisemanager.transport.tcp.port.DEFAULT=[WILY_MOM_PORT]

#######################
# JMX Configuration
#
# ================
#For LifeRay Monitoring, activate jmx, set introscope.agent.jmx.enable=true
introscope.agent.jmx.enable=true

#######################
# Agent Metric Clamp Configuration
#
# ================
introscope.agent.metricClamp=3000

#######################
# Bootstrap Classes Instrumentation Manager
#
# ================
introscope.bootstrapClassesManager.enabled=false

#######################
# Remote Dynamic Instrumentation Settings
#
# ================
introscope.agent.remoteagentdynamicinstrumentation.enabled=false

#######################
# Dynamic Instrumentation Settings
# =================================
introscope.autoprobe.dynamicinstrument.enabled=false
introscope.autoprobe.deepinheritance.enabled=false
introscope.autoprobe.hierarchysupport.enabled=false

################################
# Agent Metric Aging
# ==============================
introscope.agent.metricAging.heartbeatInterval=1800
introscope.agent.metricAging.numberTimeslices=3000

#########################################
# Servlet Header Decorator
# =======================================
# Set true for enable the correlation of transaction between Wily CEM and Wily Introscope
introscope.agent.decorator.enabled=false
introscope.agent.decorator.security=clear

#######################
# Application Map Agent Side
#
# ================
introscope.agent.appmap.intermediateNodes.enabled=false

######################
# Application Map and Socket
#
# ==================
introscope.agent.sockets.managed.reportToAppmap=false

######################
# Smart Instrumentation properties
#
# ==================
introscope.agent.deep.instrumentation.level=medium

log4j.logger.IntroscopeAgent=INFO, console


######################
# SOA properties version 10.1
#
# ==================

#agent.httpheaderinsertion.enabled
agent.httpheaderinsertion.enabled=true
#Enables or disables the insertion of client-side correlation information in HTTP headers.

#agent.httpheaderread.enabled
agent.httpheaderread.enabled=true
#Enables or disables the server-side retrieval of correlation information from HTTP headers.

#agent.soapheaderinsertion.enabled
agent.soapheaderinsertion.enabled=true
#Enables or disables the insertion of client-side correlation information in SOAP headers.

#agent.soapheaderread.enabled
agent.soapheaderread.enabled=true
#Enables or disables the server-side retrieval of correlation information from SOAP headers.

#agent.soa.metricNameFormatting
#Modifies CA APM for SOA metric names to replace any specified character or characters with an underscore [_].

#agent.transactiontrace.boundaryTracing.cacheFlushFrequency
#Specifies the number of days to hold dependency data in the agent memory before flushing the cache.

#agent.transactiontrace.boundaryTracing.enable
agent.transactiontrace.boundaryTracing.enable=true
#Enables or disables boundary tracing for transactions.

#soa.client.prependhandler
#Controls the insertion point of the SOAP header on the client-side.

#soa.server.appendhandler
#Controls the retrieval and removal of the SOAP header on the server-side.

#com.wily.soa.dependencyarray.maxsize
#Clamps the SOA Dependency Map edges collected on the Agent side to avoid unexpected memory overhead.
