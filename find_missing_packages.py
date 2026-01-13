#!/usr/bin/env python3
"""
Query rims_data for specific missing pkg_code2 values and generate destSel records.
Uses the provided list of missing codes instead of scanning entire table.
"""

import requests
import json
import re
import time
from collections import Counter

# Caspio credentials
CLIENT_ID = "66e0b1c620d74295c97e40374ab9d511c226e4f739725cdc8a"
CLIENT_SECRET = "5887478fd13240aca74f9999f6b4d7ad5f6cd48cbaff57e3ab"
BASE_URL = "https://***REMOVED***.caspio.com"

# All 24 destSel columns
DESTSEL_COLUMNS = [
    "PK_ID", "rank", "pkgCode", "pkgCode2", "vacation_type", "vaca_desc",
    "depart_city", "destination", "length_descr", "ngts", "ref_dep", "deposit",
    "dest_notes", "v_type", "online_dt", "dest", "dt_notes", "dt_notesD",
    "stay21", "rrtc", "url", "pkgCode_url", "act_url", "fk_updt"
]

# IATA airport codes to city names (matching destSel groupings)
IATA_TO_CITY = {
    # California - Bay Area grouped together
    'LAX': 'Los Angeles',
    'SFO': 'San Francisco Bay Area', 'OAK': 'San Francisco Bay Area', 'SJC': 'San Francisco Bay Area',
    'SAN': 'San Diego',
    'SMF': 'Sacramento',
    'LGB': 'Long Beach', 'ONT': 'Ontario', 'BUR': 'Los Angeles', 'SNA': 'Orange County',
    # Nevada
    'LAS': 'Las Vegas', 'RNO': 'Reno',
    # Arizona
    'PHX': 'Phoenix', 'TUS': 'Tucson',
    # Texas
    'DFW': 'Dallas', 'DAL': 'Dallas',
    'IAH': 'Houston', 'HOU': 'Houston',
    'AUS': 'Austin', 'SAT': 'San Antonio',
    # Florida
    'MIA': 'Miami', 'FLL': 'Fort Lauderdale', 'TPA': 'Tampa',
    'MCO': 'Orlando', 'JAX': 'Jacksonville', 'RSW': 'Fort Myers',
    # Northeast - NY Area grouped
    'JFK': 'New York Area', 'LGA': 'New York Area', 'EWR': 'New York Area',
    'BOS': 'Boston', 'PHL': 'Philadelphia', 'BUF': 'Buffalo',
    'PIT': 'Pittsburgh', 'BWI': 'Baltimore', 'BDL': 'Hartford',
    # Washington DC Area
    'DCA': 'Washington DC Area', 'IAD': 'Washington DC Area',
    # Midwest - Chicago grouped
    'ORD': 'Chicago', 'MDW': 'Chicago',
    'DTW': 'Detroit', 'MSP': 'Minneapolis', 'STL': 'St. Louis',
    'MCI': 'Kansas City', 'CLE': 'Cleveland', 'CVG': 'Cincinnati',
    'IND': 'Indianapolis', 'MKE': 'Milwaukee', 'CMH': 'Columbus',
    'OMA': 'Omaha', 'DSM': 'Des Moines',
    # Southeast
    'ATL': 'Atlanta', 'CLT': 'Charlotte', 'RDU': 'Raleigh-Durham',
    'BNA': 'Nashville', 'MEM': 'Memphis', 'MSY': 'New Orleans',
    'OKC': 'Oklahoma City', 'TUL': 'Tulsa', 'LIT': 'Little Rock',
    'CHS': 'Charleston, SC', 'MOB': 'Mobile, AL',
    # Northwest/West
    'SEA': 'Seattle', 'PDX': 'Portland', 'SLC': 'Salt Lake City',
    'DEN': 'Denver', 'ABQ': 'Albuquerque', 'BOI': 'Boise', 'GEG': 'Spokane',
    # Hawaii
    'HNL': 'Honolulu', 'OGG': 'Maui', 'LIH': 'Kauai', 'KOA': 'Kona',
    # Other
    'ANC': 'Anchorage', 'SJU': 'San Juan, PR',
    # Canada
    'YYZ': 'Toronto', 'YVR': 'Vancouver', 'YYC': 'Calgary',
    # Michigan
    'GRR': 'Grand Rapids',
}

# Cruise departure port letters in package codes
# Letter position varies by package type
CRUISE_PORT_LETTERS = {
    'M': 'Miami',
    'F': 'Fort Lauderdale',
    'L': 'Long Beach',
    'G': 'Galveston',
    'N': 'New Orleans',
    'S': 'San Francisco',
    'T': 'Tampa',
    'P': 'Port Canaveral',
    'B': 'Baltimore',
    'H': 'Honolulu',
    'A': 'Los Angeles',
}

# Missing pkg_code2 values from destSel_missingRimsTable.csv
MISSING_CODES = [
    "BPRT", "BRF", "BRT", "BRV", "BRWB", "BRWL", "BRWO", "CBSBO", "CCAGAF", "CCAGAL",
    "CCAGAS", "CCAGMF", "CCAGML", "CCAGMS", "CCAHAL", "CCAHAS", "CCAHMF", "CCAHML",
    "CCAHMS", "CCGBF", "CCGBS", "CCGCF", "CCGCS", "CCGDF", "CCGDS", "CCPAF", "CCPAS",
    "CCPBF", "CCPBS", "CCPCAF", "CCPCAL", "CCPCAS", "CCPCMF", "CCPCML", "CCPCMS",
    "CCPDAS", "CCPDML", "CCPEAF", "CCPEAL", "CCPEAS", "CCPEMF", "CCPEML", "CCPEMS",
    "CCPFAM", "CCPFBF", "CCPFBM", "CCPFCF", "CCPFCM", "CCPFCS", "CCPFDF", "CCPFDM",
    "CCPFDS", "CCPGBM", "CCPGCM", "CCPGDM", "CCPHAF", "CCPHAL", "CCPHAS", "CCPHMF",
    "CCPHML", "CCPHMS", "CCPMAM", "CCPMBM", "CCPMCM", "CCPMDM", "CCSFM", "CCSLM",
    "CCSPM", "CCTU", "CDGDBS", "CDGDMS", "CFA", "CFC", "CFCBF", "CFCBT", "CFCCS",
    "CFCMF", "CFCMS", "CFCMT", "CFCSS", "CFD", "CFM", "CFR", "CJA", "CJACDE",
    "CJACDT", "CJACLA", "CJACMI", "CJACPX", "CJACSD", "CJACSE", "CJACSF", "CJACTP",
    "CJAFDE", "CJAFLA", "CJAFSA", "CJAFSD", "CJAFSN", "CJAOBD", "CJAOLA", "CJAOMN",
    "CJAVBO", "CJAVDW", "CJAVLA", "CJAVNY", "CJAVON", "CJAVSD", "CJAVSF", "CJC",
    "CJCBF", "CJCBT", "CJCCS", "CJCMF", "CJCMS", "CJCMT", "CJCSS", "CJD", "CJDB",
    "CJDC", "CJDD", "CJDF", "CJDH", "CJDJ", "CJDK", "CJDL", "CJDM", "CJDN", "CJDO",
    "CJDP", "CJDV", "CJDW", "CJDY", "CJM", "CJMC", "CJML", "CJMM", "CJMP", "CJMV",
    "CJR", "CJRMC", "CLR", "CLZC", "CPC", "CPRB", "CPRM", "CPUB", "CPVB", "CPVM",
    "CPZB", "CPZM", "CRCD", "CRCI", "CTCCF", "CTCCL", "CTCCS", "CTLC", "CTLV", "CTS",
    "DAWAU", "DAWDC", "DAWLV", "DAWMI", "DAWPD", "DAWPH", "DAWPX", "DAWSD", "DAWSF",
    "DBEDF", "DLEBN", "DLESE", "DLSBO", "DLSDC", "DLSDE", "DLSLV", "DLSON", "DLWCL",
    "DLWLA", "DLWLV", "DLWME", "DSLA", "DSPD", "DVEBN", "DVEFL", "DVELV", "DXSDF",
    "DXSHU", "DXSRN", "DXSTU", "DXWDF", "DZWLT", "EBAK", "EBAL", "EBAM", "EBAO",
    "EBAP", "EBAV", "EBFNA", "ECACLI", "ECACPV", "ECARHU", "ECASNY", "ECBEN",
    "ECGRDF", "ECXRHU", "EKHBXX", "EMMB", "ERALC", "ERANY", "ESCDF", "ESCDR",
    "ESCPR", "ETG", "ETGL", "ETGR", "ETPA", "ETRA", "ETRB", "ETRC", "ETV", "ETX",
    "ETXO", "ETXV", "EVA", "EVL", "EVR", "EXAD", "EXJA", "EZFBX", "EZFJX", "EZFOR",
    "EZHJX", "EZTDF", "HCFF", "HCFH", "HCFL", "HCFM", "HCFN", "HCFO", "HCFP", "HCFR",
    "HCFS", "HCFV", "HTB", "ICRV", "JTO", "KCNCM", "KCNEW", "KCVF", "KCVL", "KCVO",
    "KCVS", "KDFST", "KDHDL", "KDHSL", "KDHUD", "KDHUL", "KDOD", "KDOH", "KDOL",
    "KDOS", "KDRBD", "KDRBO", "KDRNY", "KDWDD", "KDWDU", "KDWUD", "KDXAT", "KDXBD",
    "KDXBN", "KDXBO", "KDXBW", "KDXCH", "KDXDC", "KDXDW", "KDXHU", "KDXME", "KDXMK",
    "KDXMS", "KDXSA", "KDZAE", "KDZBD", "KDZCM", "KDZDW", "KDZHU", "KDZPI", "KDZRI",
    "KDZSA", "KDZSF", "KDZSY", "KFOF", "KHCH", "KHGF", "KHGL", "KHMF", "KHML",
    "KHMP", "KHMS", "KHMU", "KHXDS", "KHXHF", "KHXVF", "KHXVS", "KLDDD", "KLDDF",
    "KLDDS", "KLDDU", "KLDLU", "KLDSD", "KLDSF", "KLDSS", "KLDSU", "KLDUD", "KLDUF",
    "KLDUS", "KLDUU", "KLGD", "KLGL", "KLGS", "KLGU", "KLGZ", "KLNDD", "KLNDF",
    "KLNDM", "KLNDU", "KLNSD", "KLNSF", "KLNSU", "KLNUD", "KLNUF", "KLNUU", "KLVDF",
    "KLVDS", "KLVLF", "KLVLS", "KLVSF", "KLVSS", "KLVUF", "KLVUS", "KLVVF", "KLVVS",
    "KLVZF", "KLVZS", "KLWFD", "KLWFL", "KLWND", "KLWNL", "KLXLV", "KLXPX", "KLXSE",
    "KLXSF", "KLXSL", "KLXSM", "KMNCM", "KMNST", "KMOCL", "KMOMC", "KMVAT", "KMVCL",
    "KMVCM", "KMVCV", "KMVMC", "KNDF", "KNDS", "KNDU", "KNVF", "KNVS", "KPDA",
    "KPDB", "KPDC", "KPDD", "KPDF", "KPDH", "KPDK", "KPDL", "KPDN", "KPDP", "KPDS",
    "KPDU", "KPOA", "KPOB", "KPOC", "KPOD", "KPOF", "KPOH", "KPOK", "KPOL", "KPON",
    "KPOS", "KPOU", "KPVA", "KPVB", "KPVC", "KPVD", "KPVF", "KPVH", "KPVK", "KPVL",
    "KPVN", "KPVP", "KPVS", "KPVU", "KSDF", "KSDP", "KSDV", "KSLF", "KSLS", "KSLV",
    "KSSV", "KVOA", "KVOB", "KVOC", "KVOD", "KVOF", "KVOH", "KVOK", "KVON", "KVOP",
    "KVOS", "KVOU", "KVTYY", "KVVA", "KVVB", "KVVC", "KVVD", "KVVF", "KVVH", "KVVK",
    "KVVL", "KVVN", "KVVP", "KVVS", "KVVU", "KVXLA", "KVXSF", "KVXYY", "LMCT",
    "LMVC", "LMVH", "LMVJ", "LMVL", "LMVM", "LMVO", "LMVS", "LMVV", "LPBB", "LPBD",
    "LPBF", "LPBH", "LPBK", "LPBL", "LPBM", "LPBN", "LPBO", "LPBV", "LPBY", "LPDC",
    "LPDD", "LPDF", "LPDH", "LPDJ", "LPDK", "LPDL", "LPDN", "LPDO", "LPDP", "LPDV",
    "LPMC", "LPML", "LPMN", "LPMP", "LRA", "LRCD", "LRHB", "LRHD", "LRHS", "LRKC",
    "LRKN", "LRKX", "LRLC", "LRLE", "LRLL", "LRNHT", "LRNTC", "LRPC", "LRPM",
    "LRPP", "LRSO", "LRSW", "LRTB", "LRTT", "LRWN", "LRWP", "LRWW", "LRZT", "LSCR",
    "LSPH", "LTVA", "LTVC", "LTVD", "LTVL", "LTVN", "LTVS", "LVC", "LWCC", "LWCD",
    "LWCW", "LWNAC", "LWNCC", "LWNHT", "LWNLC", "LWNPC", "LWNSS", "LWNUN", "LXR",
    "LXV", "MITDF", "OSOB", "OSVB", "OSVD", "QZHW", "RPHA", "RPHB", "RRBA", "RRCA",
    "RVBA", "RVCA", "RVDA", "SCPS", "SGABB", "SGABC", "SGACI", "SGALA", "SGALG",
    "SGALT", "SGAMB", "SGANO", "SGAOS", "SGAPS", "SGARN", "SGASE", "SGASO", "SGBBB",
    "SGBBC", "SGBLG", "SGBLT", "SGBLV", "SGBMB", "SGBOS", "SGBPS", "SGBSE", "SGBSO",
    "SGTAU", "SGTGL", "SGTHO", "SGTLC", "SGTNO", "SGTSA", "SGTSH", "SGWAF", "SGWAN",
    "SGWAT", "SGWBC", "SGWBM", "SGWBS", "SGWCDC", "SGWCLV", "SGWCXX", "SGWV", "SXBB",
    "SXBC", "SXCI", "SXL", "SXME", "SXMR", "SXOS", "SXP", "SXR", "SXT", "SXV",
    "TBOAU", "TBOBO", "TBOBW", "TBOCM", "TBODE", "TBODF", "TBODT", "TBOHU", "TBOKC",
    "TBOLA", "TBOME", "TBOMS", "TBONY", "TBOPH", "TBOSL", "TBOST", "TBOWA", "TBVAT",
    "TBVAU", "TBVBD", "TBVBN", "TBVBO", "TBVBW", "TBVCH", "TBVCL", "TBVCM", "TBVCT",
    "TBVCV", "TBVDE", "TBVDF", "TBVDT", "TBVIN", "TBVKC", "TBVLA", "TBVMC", "TBVNO",
    "TBVNY", "TBVPH", "TBVPI", "TBVSE", "TBVSF", "TBVSL", "TBVST", "TBVTP", "TBVWA",
    "TDNO", "TDTU", "TDWA", "TFFD", "TFFL", "TFFO", "TFFU", "TFVD", "TFVL", "TFVO",
    "TFVU", "TGDD", "TGDF", "TGDO", "TGFD", "TGFL", "TGFO", "TGND", "TGNL", "TGNO",
    "TGOD", "TGOF", "TGOL", "TGOO", "TGRF", "TGRL", "TGRO", "TGTD", "TGTL", "TGTO",
    "TGVD", "TGVF", "TGVL", "TGVO", "TIBW", "TINO", "TIOR", "TIWA", "TOBF", "TOLA",
    "TOLV", "TOMS", "TONY", "TOPD", "TOPX", "TOSA", "TOSD", "TOSE", "TOSM", "TSDF",
    "TSDG", "TSDI", "TSDP", "TSDS", "TSDU", "TSV", "TTPZA", "TVAT", "TVAU", "TVBD",
    "TVBF", "TVBO", "TVBW", "TVCH", "TVCL", "TVCV", "TVDC", "TVDE", "TVDF", "TVDT",
    "TVFL", "TVGR", "TVHU", "TVLA", "TVMC", "TVMS", "TVNO", "TVNY", "TVON", "TVOR",
    "TVPD", "TVPH", "TVPX", "TVSA", "TVSD", "TVSE", "TVSF", "TVSL", "TVSM", "TWDS",
    "TWDU", "TWLS", "TWLU", "TWVF", "TWVS", "TWVU", "TXH", "TXL", "TXO", "TXOS",
    "TXR", "TXV", "VAOYC", "VAOYE", "VAOYY", "VAVYC", "VAVYY", "VGAB", "VGAT",
    "VGAU", "VGBD", "VGBF", "VGBI", "VGBN", "VGBO", "VGBW", "VGCH", "VGCL", "VGDE",
    "VGDF", "VGDT", "VGGE", "VGHO", "VGIN", "VGLA", "VGLI", "VGMC", "VGMK", "VGMN",
    "VGMS", "VGNY", "VGOA", "VGOK", "VGOM", "VGPD", "VGPH", "VGPI", "VGPV", "VGRD",
    "VGSA", "VGSD", "VGSE", "VGSF", "VGSL", "VGSM", "VGST", "VGTL", "VGTU", "VGWA",
    "VHHH", "VICDB", "VIGCM", "VIGDL", "VIGDM", "VIGJO", "VIHCA", "VIHCD", "VIHCH",
    "VIHCS", "VIHHA", "VIHHD", "VIHHH", "VIHHS", "VIHXA", "VIHXD", "VIHXH", "VIHXS",
    "VIJCD", "VIJCH", "VIJCL", "VIJCS", "VIJHD", "VIJHH", "VIJHL", "VIJHS", "VIJXD",
    "VIJXH", "VIJXL", "VIJXS", "VIWHD", "VIWHF", "VIWHL", "VIWHP", "VIWHS", "VIWHV",
    "VIWLD", "VIWLF", "VIWLL", "VIWLP", "VIWLS", "VIWLV", "VIWVD", "VIWVF", "VIWVL",
    "VIWVP", "VIWVS", "VIWVV", "VIWXD", "VIWXF", "VIWXL", "VIWXP", "VIWXS", "VIWXV",
    "VLHI", "VLHL", "VMPF", "VMPL", "VMPP", "VMPR", "VMPV", "VMSF", "VMSL", "VMSP",
    "VMSR", "VMSV", "VNDA", "VNDB", "VNDD", "VNDF", "VNDL", "VNDM", "VNDN", "VNDO",
    "VNDP", "VNDS", "VNDV", "VNDY", "VNFA", "VNFB", "VNFD", "VNFL", "VNFM", "VNFN",
    "VNFO", "VNFP", "VNFS", "VNFV", "VNFY", "VNUA", "VNUB", "VNUD", "VNUF", "VNUL",
    "VNUM", "VNUN", "VNUO", "VNUP", "VNUS", "VNUV", "VNUY", "VSFL", "VSFO", "VUDAN",
    "VUDAT", "VUDAU", "VUDBN", "VUDBO", "VUDBW", "VUDCH", "VUDCL", "VUDCT", "VUDDC",
    "VUDDE", "VUDDT", "VUDDW", "VUDFL", "VUDHU", "VUDIN", "VUDLA", "VUDLV", "VUDMC",
    "VUDME", "VUDMI", "VUDMN", "VUDMS", "VUDNY", "VUDPD", "VUDPH", "VUDPI", "VUDPX",
    "VUDRS", "VUDSA", "VUDSD", "VUDSE", "VUDSF", "VUDSL", "VUDSM", "VUDTP", "VULAN",
    "VULAT", "VULAU", "VULBD", "VULBN", "VULBO", "VULBW", "VULCH", "VULCL", "VULCM",
    "VULCT", "VULCV", "VULDC", "VULDE", "VULDT", "VULDW", "VULEW", "VULFL", "VULHN",
    "VULHU", "VULIN", "VULKC", "VULLV", "VULMC", "VULME", "VULMI", "VULMN", "VULMS",
    "VULNY", "VULPD", "VULPH", "VULPI", "VULPX", "VULRD", "VULSA", "VULSD", "VULSE",
    "VULSF", "VULSJ", "VULSL", "VULSM", "VULST", "VULTP", "VULXXX", "VYBU", "VYCF",
    "VYHF", "VYHU", "VYLF", "VYRF", "VYXD", "VYXF", "VYXU", "VZBF", "VZCAT", "VZCF",
    "VZCJA", "VZCMC", "VZCMI", "VZCTP", "VZGF", "VZGL", "VZHF", "VZHW", "VZRF",
    "VZTD", "VZTL", "VZVF", "VZWD", "VZWF", "VZWL", "VZWP", "VZXF", "XBCD", "XBCK",
    "XBCL", "XBCM", "XBCP", "XBCS", "XBCU", "XBCZ", "XBDA", "XBDO", "XBEBG", "XBECP",
    "XBECW", "XBEDL", "XBEDP", "XBEGA", "XBEGE", "XBEHP", "XBEKD", "XBEKI", "XBEKW",
    "XBEMA", "XBEOG", "XBEWC", "XBFA", "XBFB", "XBFE", "XBFH", "XBFM", "XBFS",
    "XBFT", "XBFU", "XBGD", "XBGK", "XBGL", "XBGM", "XBGP", "XBGS", "XBGU", "XBGZ",
    "XBHA", "XBHO", "XBJA", "XBJO", "XBKD", "XBKL", "XBKU", "XBMAR", "XBMSA", "XBND",
    "XBNG", "XBNK", "XBNL", "XBNM", "XBNP", "XBNR", "XBNS", "XBNU", "XBNZ", "XBRA",
    "XBRO", "XBRU", "XBSG", "XBWD", "XBWG", "XBWK", "XBWL", "XBWM", "XBWP", "XBWR",
    "XBWS", "XBWU", "XBWZ", "XBXD", "XBXG", "XBXK", "XBXL", "XBXM", "XBXS", "XBXU",
    "XEZFFK", "XGCBM", "XGCBO", "XGCDP", "XGCDS", "XGCSS", "XGNCH", "XGNDA", "XGNEN",
    "XGNLE", "XGNRB", "XGNWW", "XHGL", "XHGN", "XHSA", "XHSD", "XHSL", "XHTG",
    "XHTS", "XHXD", "XHXH", "XRET", "XWAC", "XWAG", "XWAH", "XWAN", "XWDB", "XWDC",
    "XWDG", "XWDK", "XWDV", "XWETA", "XWETS", "XWEWB", "XWEWC", "XWEWG", "XWEWV",
    "XWMB", "XWMW", "XWNMN", "XWTC", "XWTG", "XWTN", "XXEMOH", "XXEMSC", "XXEVSD",
    "XXPD", "XXRCMS", "XXRET", "XXVZC"
]

def get_token():
    resp = requests.post(
        f"{BASE_URL}/oauth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    )
    return resp.json().get("access_token")

def parse_val_file_type(vft):
    """Parse val_file_type to derive vacation_type, vaca_desc, ngts"""
    if not vft:
        return '', '', None
    vft = vft.upper().replace(' FILE', '').strip()

    # L[N] = Hotel Stay
    m = re.match(r'^L(\d+)$', vft)
    if m:
        n = int(m.group(1))
        return 'Hotel Stay', f"{n} Night Accommodations", n

    # CA[N] = Cruise w/Air
    m = re.match(r'^CA(\d+)$', vft)
    if m:
        n = int(m.group(1))
        return 'Cruise w/Air', f"{n} Night Cruise w/Air", n

    # CR[N] = Cruise only
    m = re.match(r'^CR(\d+)$', vft)
    if m:
        n = int(m.group(1))
        return 'Cruise', f"{n} Night Cruise", n

    # CRZ = Cruise
    if vft == 'CRZ':
        return 'Cruise', 'Cruise Package', None

    # ASV = Air + Hotel
    if vft == 'ASV':
        return 'Air + Hotel', 'Air + Hotel Package', None

    # ACB = Air + Cruise Bahamas
    if vft == 'ACB':
        return 'Air + Cruise', 'Air + Cruise Bahamas', None

    # ACF/ACV = Air + Cruise
    if vft in ('ACF', 'ACV'):
        return 'Air + Cruise', 'Air + Cruise Package', None

    # ART = Air Round Trip
    if vft == 'ART':
        return 'Air + Hotel', 'Air Round Trip Package', None

    # AW[X] = Air + Hotel packages
    if vft.startswith('AW'):
        return 'Air + Hotel', 'Air + Hotel Package', None

    # AH[X] = Air + Hotel
    if vft.startswith('AH'):
        return 'Air + Hotel', 'Air + Hotel Package', None

    # A[XX] = Air packages
    if len(vft) >= 2 and vft[0] == 'A' and vft[1].isalpha():
        return 'Air + Hotel', 'Air Package', None

    # CF = Certificate File
    if vft == 'CF':
        return 'Certificate', 'Certificate Package', None

    return '', '', None

def determine_depart_city(pkg_code2, from_cities, vacation_type, destination):
    """
    Determine departure city from:
    1. from_city IATA codes in rims_data
    2. Package code letters for cruises
    3. Destination-based defaults for cruises
    """
    # First try from_city IATA codes
    if from_cities:
        city_counter = Counter()
        for fc in from_cities:
            fc = fc.upper().strip()
            if fc in IATA_TO_CITY:
                city_counter[IATA_TO_CITY[fc]] += 1
            elif fc and fc != '-SE' and len(fc) == 3:
                # Unknown IATA code - keep it for reporting
                city_counter[f"UNKNOWN:{fc}"] += 1

        if city_counter:
            # Return most common city
            most_common = city_counter.most_common(1)[0][0]
            if not most_common.startswith("UNKNOWN:"):
                return most_common

    # For cruises, try to determine from package code
    if vacation_type and 'Cruise' in vacation_type:
        pkg = pkg_code2.upper()

        # Look for port letter - usually near end of code
        # Try last letter, then second-to-last
        for pos in [-1, -2, -3]:
            if len(pkg) > abs(pos):
                letter = pkg[pos]
                if letter in CRUISE_PORT_LETTERS:
                    return CRUISE_PORT_LETTERS[letter]

        # Destination-based defaults for cruises
        dest_upper = destination.upper() if destination else ''
        if 'MEXICO' in dest_upper or 'RIVIERA' in dest_upper:
            # Mexico cruises from Galveston or Long Beach
            return None  # Need to determine from other info
        if 'BAHAMAS' in dest_upper or 'CARIBBEAN' in dest_upper or 'W. CARIBBEAN' in dest_upper:
            # Caribbean/Bahamas from Miami or Fort Lauderdale
            return 'Miami'
        if 'ALASKA' in dest_upper:
            # Alaska cruises typically from Seattle or San Francisco
            return None  # Need to determine from other info

    # Hotel-only packages - no departure city needed
    if vacation_type and vacation_type in ['Hotel Stay', 'Casino', 'Timeshare', 'Theme Park', 'Water Park']:
        return 'NA'

    return None  # Unknown

def query_package_data(token, pkg_code2):
    """Query rims_data for a specific pkg_code2 and return aggregated data"""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}/rest/v2/tables/rims_data/records"

    # Query with filter for this pkg_code2
    params = {
        "q.select": "pkg_code2,dest,conf_deposit,val_dep,val_file_type,from_city",
        "q.where": f"pkg_code2='{pkg_code2}'"
    }

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=60)
        data = resp.json()

        if isinstance(data, list):  # Rate limited
            return None

        records = data.get("Result", [])
        if not records:
            return None

        # Aggregate data
        dests = set()
        deposits = []
        val_deps = []
        val_file_types = set()
        from_cities = []

        for r in records:
            if r.get("dest"):
                dests.add(r["dest"].strip())
            if r.get("conf_deposit") and r["conf_deposit"] > 0:
                deposits.append(r["conf_deposit"])
            if r.get("val_dep") is not None and r["val_dep"] > 0:
                val_deps.append(r["val_dep"])
            if r.get("val_file_type"):
                val_file_types.add(r["val_file_type"].strip())
            if r.get("from_city"):
                from_cities.append(r["from_city"].strip())

        return {
            'dest': dests,
            'deposits': deposits,
            'val_deps': val_deps,
            'val_file_types': val_file_types,
            'from_cities': from_cities,
            'count': len(records)
        }
    except Exception as e:
        print(f"  Error querying {pkg_code2}: {e}")
        return None

def main():
    print(f"Processing {len(MISSING_CODES)} missing package codes...\n")

    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Collect data for each missing code
    package_data = {}

    for i, pkg in enumerate(MISSING_CODES):
        pkg_upper = pkg.upper()

        # Rate limit handling
        if i > 0 and i % 50 == 0:
            print(f"\nProcessed {i}/{len(MISSING_CODES)}...")
            time.sleep(2)
            token = get_token()  # Refresh token

        data = query_package_data(token, pkg_upper)

        if data is None:
            # Try refreshing token and retry
            time.sleep(1)
            token = get_token()
            data = query_package_data(token, pkg_upper)

        if data:
            package_data[pkg_upper] = data
            print(f"  {pkg_upper}: {data['count']} records, dest={list(data['dest'])[:2]}")
        else:
            # No data found - still include with empty data
            package_data[pkg_upper] = {
                'dest': set(),
                'deposits': [],
                'val_deps': [],
                'val_file_types': set(),
                'from_cities': [],
                'count': 0
            }
            print(f"  {pkg_upper}: No data found")

    print(f"\n\nGenerating TSV with {len(package_data)} packages...")

    # Track packages where we can't determine departure city
    unknown_departures = []

    # Generate TSV
    output = "/Users/nickmac/VSC-Claude-User-Data/missing_packages_destsel.tsv"
    with open(output, 'w') as f:
        f.write('\t'.join(DESTSEL_COLUMNS) + '\n')

        pk_id = 2000
        for pkg in sorted(package_data.keys()):
            info = package_data[pkg]

            vft = list(info['val_file_types'])[0] if info['val_file_types'] else ''
            vacation_type, vaca_desc, ngts = parse_val_file_type(vft)
            destination = list(info['dest'])[0] if info['dest'] else ''
            deposit = Counter(info['deposits']).most_common(1)[0][0] if info['deposits'] else 0
            ref_dep = Counter(info['val_deps']).most_common(1)[0][0] if info['val_deps'] else 100
            # Determine pkgCode length based on prefix:
            # - CF, CJ, D*, LX, SX, T*, VA, VG, VM, VN = 2 letters
            # - CCA, CCP, CRCI, CRCD, RPH, RRB, RVB = 4 letters
            # - Default = 3 letters (includes VI, VU)
            upper_pkg = pkg.upper()
            if upper_pkg.startswith(('CF', 'CJ', 'D', 'LX', 'SX', 'T', 'VA', 'VG', 'VM', 'VN')) and len(pkg) >= 2:
                pkg_code = pkg[:2]
            elif upper_pkg.startswith(('CCA', 'CCP', 'CRCI', 'CRCD', 'RPH', 'RRB', 'RVB')) and len(pkg) >= 4:
                pkg_code = pkg[:4]
            else:
                pkg_code = pkg[:3] if len(pkg) > 3 else pkg
            length_descr = f"{ngts} Nights" if ngts else ''

            # Determine departure city
            from_cities = info.get('from_cities', [])
            depart_city = determine_depart_city(pkg, from_cities, vacation_type, destination)
            if depart_city is None:
                depart_city = 'NA'
                # Track this for reporting if it's an air or cruise package
                if vacation_type and ('Air' in vacation_type or 'Cruise' in vacation_type):
                    unknown_departures.append({
                        'pkg_code2': pkg,
                        'vacation_type': vacation_type,
                        'destination': destination,
                        'ngts': ngts,
                        'from_cities': list(set(from_cities))[:5]  # Sample of from_city values
                    })

            row = [
                str(pk_id),      # PK_ID
                '',              # rank
                pkg_code,        # pkgCode
                pkg,             # pkgCode2
                vacation_type,   # vacation_type
                vaca_desc,       # vaca_desc
                depart_city,     # depart_city
                destination,     # destination
                length_descr,    # length_descr
                str(ngts) if ngts else '',  # ngts
                f'{ref_dep:.2f}',  # ref_dep (from val_dep)
                f'{deposit:.2f}',  # deposit (from conf_deposit)
                '',              # dest_notes
                '',              # v_type
                'False',         # online_dt
                '',              # dest
                '',              # dt_notes
                '',              # dt_notesD
                'False',         # stay21
                'False',         # rrtc
                '',              # url
                '',              # pkgCode_url
                'https://activatemytrip.com',  # act_url
                ''               # fk_updt
            ]
            f.write('\t'.join(row) + '\n')
            pk_id += 1

    print(f"\nSaved to {output}")
    print(f"Total packages: {len(package_data)}")

    # Report packages with unknown departure cities
    if unknown_departures:
        print(f"\n\n=== PACKAGES WITH UNKNOWN DEPARTURE CITY ({len(unknown_departures)}) ===")
        print("These need manual review to determine departure city:\n")

        # Group by destination
        by_dest = {}
        for u in unknown_departures:
            dest = u['destination'] or 'UNKNOWN'
            if dest not in by_dest:
                by_dest[dest] = []
            by_dest[dest].append(u)

        for dest in sorted(by_dest.keys()):
            print(f"\n--- {dest} ---")
            for u in by_dest[dest]:
                ngts = u['ngts'] if u['ngts'] else '?'
                from_cities_str = ', '.join(u['from_cities']) if u['from_cities'] else 'none'
                print(f"  {u['pkg_code2']}: {u['vacation_type']}, {ngts} nights, from_city: [{from_cities_str}]")

        # Save to file for easy review
        unknown_output = "/Users/nickmac/VSC-Claude-User-Data/unknown_departures.txt"
        with open(unknown_output, 'w') as f:
            f.write(f"PACKAGES WITH UNKNOWN DEPARTURE CITY ({len(unknown_departures)})\n")
            f.write("="*60 + "\n\n")
            f.write("pkg_code2\tvacation_type\tdestination\tngts\tfrom_cities\n")
            for u in unknown_departures:
                ngts = str(u['ngts']) if u['ngts'] else ''
                from_cities_str = ','.join(u['from_cities']) if u['from_cities'] else ''
                f.write(f"{u['pkg_code2']}\t{u['vacation_type']}\t{u['destination']}\t{ngts}\t{from_cities_str}\n")
        print(f"\n\nSaved unknown departures to: {unknown_output}")

if __name__ == "__main__":
    main()
