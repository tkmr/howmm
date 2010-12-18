require 'rubygems'
require 'daemons'

Daemons.run('ruby -rubygems -rgroonga /home/tatsuya/github/howmm/groonga/searcher.rb')
