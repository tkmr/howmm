God.watch do |w|
  w.name      = 'searcher'
  w.interval  = 5.second
  w.start     = 'ruby -rubygems -rgroonga ' + File.dirname(__FILE__) + '/searcher.rb druby://localhost:1983'

  w.start_if do |start|
    start.condition(:process_running) do |c|
      c.running = false
    end
  end
end