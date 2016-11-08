########################################################################
# CA Cross-Enterprise Application Performance Management
#
#	CA Wily Introscope(R) Version 10.1.0 Build 990014
# 	Copyright (c) 2015 CA. All Rights Reserved.
# 	Introscope(R) is a registered trademark of CA.
#
# SYSVIEW CTG Tracer Configuration Template
#
# In order for the configuration options in this template file to be
# used they must be copied into file IntroscopeAgent.profile 
########################################################################


###############################################################################
# To use this option copy it into the  IntroscopeAgent.profile 
#
# Please specify whether your CTG Server supports IPIC communications
#
# Possible Values:
#    true  = The CTG Server supports IPIC communications.
#            The CTG Tracer is allowed to add a channel to JavaGateway.flow()  
#            calls which have no channel and no commarea specified.
#    false = The CTG Server may or may not support IPIC communications.
#            The CTG Tracer will not add a channel to JavaGateway.flow()  
#            calls.
# The default is false if the property is not specified, or is not set
# e.g. ceapm.ipic.supported=
ceapm.ipic.supported=false

###############################################################################
# To use this option copy it into the  IntroscopeAgent.profile 
#
# Please specify a regular expression pattern to filter which CICS transactions
# can use channel decoration. The pattern is applied to the Program Name
# specified in the eciRequest object passed to JavaGateway.flow(). 
# 
# Matching transaction calls with be decorated if they have a channel.
# Channel decoration is accomplished by adding new containers which contain the 
# APM transaction correlation decoration information.
#
# If no channel and no commarea is present in the eciRequest object then a 
# new channel will be added to recieve the new containers, but only if the 
# property ceapm.ipic.supported is set true.
#
# To disable channel decoration, set this property blank:
#    ceapm.channel.program.name.regex=
# To match all Program Names:
#    ceapm.channel.program.name.regex=.*
# To match a specific Program Name:
#    ceapm.channel.program.name.regex=NAME
# To match more than one Program Name:
#    ceapm.channel.program.name.regex=NAMEA|NAMEB
# To match all Program Name with the prefix "PROGRAM":
#    ceapm.channel.program.name.regex=PROGRAM.*
# To match all Program Name with the suffix "NAME":
#    ceapm.channel.program.name.regex= .*?NAME
#
# The default if the property is not specified is to match all CICS transactions
# e.g. ceapm.channel.program.name.regex=.*
ceapm.channel.program.name.regex=.*

